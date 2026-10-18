import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../modules/users/user.model.js";
import { environment } from "../../config/environment.js";
import { authCookieOptions } from "../../utils/auth-cookie-options.js";

const isStrongPassword = (password) =>
  typeof password === "string" &&
  password.length >= 12 &&
  password.length <= 128 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};
    if (typeof currentPassword !== "string" || !isStrongPassword(newPassword))
      return res
        .status(400)
        .json({
          message:
            "New password must be 12+ characters and include uppercase, lowercase, a number, and a symbol",
        });
    const user = await User.findById(req.user._id).select("+password");
    if (!user || !(await bcrypt.compare(currentPassword, user.password)))
      return res.status(400).json({ message: "Current password is incorrect" });
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();
    // Replace the invalidated cookie immediately so the current user remains signed in.
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        businessId: user.businessId?.toString() ?? null,
        role: user.role,
      },
      environment.ACCESS_TKN_SECRET,
      { expiresIn: environment.ACCESS_TKN_EXPIRE },
    );
    res.cookie("accessToken", token, authCookieOptions);
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Password change failed:", error);
    return res.status(500).json({ message: "Unable to change password" });
  }
};
export { changePassword };
