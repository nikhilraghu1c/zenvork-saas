import User from "../../modules/users/user.model.js";
import {
  authenticatedUserResponse,
  createAccessToken,
  getAccessibleBusiness,
} from "../../modules/auth/auth-account.service.js";
import {
  findRefreshSession,
  revokeRefreshSession,
  rotateRefreshSession,
} from "../../modules/auth/auth-session.service.js";
import {
  authCookieOptions,
  refreshCookieOptions,
} from "../../utils/auth-cookie-options.js";

const clearAuthenticationCookies = (res) => {
  // Remove both client credentials together so a stale refresh cookie cannot outlive its access session.
  res.clearCookie("accessToken", authCookieOptions);
  res.clearCookie("refreshToken", refreshCookieOptions);
};

/** Returns safe identity metadata after userAuth has verified the short-lived access cookie. */
const getCurrentSession = async (req, res) => {
  try {
    // Return only display-safe metadata; tokens and full user documents never leave the server.
    return res.status(200).json({
      user: authenticatedUserResponse(req.user, req.business),
    });
  } catch (error) {
    console.error("Session recovery failed:", error);
    return res.status(500).json({ message: "Unable to restore session" });
  }
};

/** Rotates an opaque refresh session and replaces the expired access cookie without exposing tokens. */
const refreshSession = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  try {
    // The indexed token hash identifies the trusted session, which supplies its server-owned userId.
    const session = await findRefreshSession(refreshToken);
    if (!session) {
      // Missing, expired, or already-rotated tokens cannot retain browser authentication state.
      clearAuthenticationCookies(res);
      return res.status(401).json({ message: "Unauthorized: Please login" });
    }

    // Reload the account instead of trusting a historic session snapshot of role or tenant access.
    const user = await User.findById(session.userId);
    let business;
    try {
      // Refresh must enforce the same active-user and active-business rules as every protected request.
      business = await getAccessibleBusiness(user);
    } catch (error) {
      // An unavailable account loses the durable session as well as both browser cookies.
      await revokeRefreshSession(refreshToken);
      clearAuthenticationCookies(res);
      return res.status(error.statusCode ?? 401).json({ message: error.message });
    }

    // A session created before a password change cannot mint another access token.
    if (user.passwordChangedAt && session.createdAt < user.passwordChangedAt) {
      // A password update invalidates any session that predates it, even if cleanup was interrupted.
      await revokeRefreshSession(refreshToken);
      clearAuthenticationCookies(res);
      return res.status(401).json({ message: "Unauthorized: Please login" });
    }

    // Atomic rotation ensures that only one request can exchange this refresh token for a replacement.
    const rotatedRefreshToken = await rotateRefreshSession(session, refreshToken);
    if (!rotatedRefreshToken) {
      // A competing request already consumed this token, so do not issue another authenticated session.
      clearAuthenticationCookies(res);
      return res.status(401).json({ message: "Unauthorized: Please login" });
    }

    // Replace both credentials together so subsequent protected requests use the new access session.
    res.cookie("accessToken", createAccessToken(user), authCookieOptions);
    res.cookie("refreshToken", rotatedRefreshToken, refreshCookieOptions);
    return res.status(200).json({
      user: authenticatedUserResponse(user, business),
    });
  } catch (error) {
    console.error("Session refresh failed:", error);
    clearAuthenticationCookies(res);
    return res.status(500).json({ message: "Unable to refresh session" });
  }
};

export { getCurrentSession, refreshSession };
