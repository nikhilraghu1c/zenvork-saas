import { authCookieOptions } from "../../utils/auth-cookie-options.js";

const logout = (req, res) => {
  // Clear the browser session cookie using the same security settings as login.
  res.clearCookie("accessToken", authCookieOptions);

  return res.status(200).json({ message: "Logout successful" });
};

export { logout };
