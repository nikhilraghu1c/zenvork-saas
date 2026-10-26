import validator from "validator";
import User from "../../modules/users/user.model.js";
import {
  authenticatedUserResponse,
  createAccessToken,
  getAccessibleBusiness,
} from "../../modules/auth/auth-account.service.js";
import { createRefreshSession } from "../../modules/auth/auth-session.service.js";
import {
  authCookieOptions,
  refreshCookieOptions,
} from "../../utils/auth-cookie-options.js";

const invalidCredentials = (res) =>
  res.status(401).json({ message: "Invalid credentials" });

const login = async (req, res) => {
  try {
    // Validate credentials and create a tenant-scoped authenticated session.
    const { identifier, password } = req.body;

    if (
      typeof identifier !== "string" ||
      typeof password !== "string" ||
      (!validator.isEmail(identifier.trim()) &&
        !/^[6-9]\d{9}$/.test(identifier.trim()))
    ) {
      return invalidCredentials(res);
    }

    const normalizedIdentifier = identifier.trim();
    const userLookup = validator.isEmail(normalizedIdentifier)
      ? { email: normalizedIdentifier.toLowerCase() }
      : { mobile: normalizedIdentifier };
    // Accounts explicitly deactivated by an owner cannot start a new session.
    const user = await User.findOne({
      ...userLookup,
      isActive: { $ne: false },
    }).select("+password");

    if (!user) {
      return invalidCredentials(res);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return invalidCredentials(res);
    }

    let business;
    try {
      // Login validates the tenant lifecycle before creating either browser session cookie.
      business = await getAccessibleBusiness(user);
    } catch (error) {
      return res.status(error.statusCode ?? 401).json({ message: error.message });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = await createRefreshSession(user._id);
    res.cookie("accessToken", accessToken, authCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return res.status(200).json({
      message: "Login successful",
      user: authenticatedUserResponse(user, business),
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Login failed" });
  }
};

export { login };
