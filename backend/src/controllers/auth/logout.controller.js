import { revokeRefreshSession } from "../../modules/auth/auth-session.service.js";
import {
  authCookieOptions,
  refreshCookieOptions,
} from "../../utils/auth-cookie-options.js";

const logout = async (req, res) => {
  try {
    // Revoke the durable session server-side before clearing both browser cookies.
    await revokeRefreshSession(req.cookies.refreshToken);
    res.clearCookie("accessToken", authCookieOptions);
    res.clearCookie("refreshToken", refreshCookieOptions);

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout failed:", error);
    return res.status(500).json({ message: "Unable to log out" });
  }
};

export { logout };
