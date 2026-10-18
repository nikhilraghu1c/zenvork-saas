import jwt from "jsonwebtoken";
import validator from "validator";
import { environment } from "../../config/environment.js";
import User from "../../modules/users/user.model.js";
import Business from "../../modules/business/business.model.js";
import { authCookieOptions } from "../../utils/auth-cookie-options.js";

const { ACCESS_TKN_SECRET, ACCESS_TKN_EXPIRE } = environment;

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

    if (user.role !== "PLATFORM_ADMIN") {
      // Deny unavailable tenants during login as well as during their subsequent API requests.
      const business = await Business.findById(user.businessId)
        .select("status planExpiresAt")
        .lean();
      const isExpired =
        business?.planExpiresAt &&
        business.planExpiresAt.getTime() < Date.now();
      if (!business || business.status !== "ACTIVE" || isExpired) {
        return res.status(403).json({
          message: "Business account is unavailable. Please contact support.",
        });
      }
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        businessId: user.businessId?.toString() ?? null,
        role: user.role,
      },
      ACCESS_TKN_SECRET,
      { expiresIn: ACCESS_TKN_EXPIRE },
    );

    res.cookie("accessToken", token, authCookieOptions);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email ?? null,
        mobile: user.mobile,
        role: user.role,
        businessId: user.businessId ?? null,
        bookingAccessScope:
          user.role === "OWNER" ? "ALL" : (user.bookingAccessScope ?? "NONE"),
        canSendReminders:
          user.role === "OWNER" || user.canSendReminders === true,
        passwordChangedAt: user.passwordChangedAt,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Login failed" });
  }
};

export { login };
