import { environment } from "../../config/environment.js";

const logout = (req, res) => {
  // Clear the browser session cookie using the same security settings as login.
  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: environment.NODE_ENV === "production",
  });

  return res.status(200).json({ message: "Logout successful" });
};

export { logout };
