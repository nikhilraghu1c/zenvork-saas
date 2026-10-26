import bcrypt from "bcrypt";
import User from "../../modules/users/user.model.js";
import {
  createAccessToken,
} from "../../modules/auth/auth-account.service.js";
import {
  createRefreshSession,
  revokeAllRefreshSessions,
} from "../../modules/auth/auth-session.service.js";
import {
  authCookieOptions,
  refreshCookieOptions,
} from "../../utils/auth-cookie-options.js";

const isStrongPassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  password.length <= 128 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};
    if (typeof currentPassword !== "string" || !isStrongPassword(newPassword))
      return res.status(400).json({
        message:
          "New password must be 8+ characters and include uppercase, lowercase, a number, and a symbol",
      });
    const user = await User.findById(req.user._id).select("+password");
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    // Compare against the stored hash so an unchanged password cannot rotate the session timestamp.
    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();
    // Password rotation revokes every remembered browser, then creates a fresh session for this browser.
    await revokeAllRefreshSessions(user._id);
    const refreshToken = await createRefreshSession(user._id);
    res.cookie("accessToken", createAccessToken(user), authCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Password change failed:", error);
    return res.status(500).json({ message: "Unable to change password" });
  }
};
export { changePassword };
