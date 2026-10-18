import { environment } from "../config/environment.js";
import jwt from "jsonwebtoken";
import User from "../modules/users/user.model.js";
import Business from "../modules/business/business.model.js";

const { ACCESS_TKN_SECRET } = environment;

const userAuth = async (req, res, next) => {
  try {
    // Verify the session token and attach the current Zenvork user to the request.
    const accessToken =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized: Please Login" });
    }
    const decodedToken = jwt.verify(accessToken, ACCESS_TKN_SECRET);
    const user = await User.findById(decodedToken.userId);
    // Re-check account access for every request so deactivation also invalidates existing sessions.
    if (!user || user.isActive === false) {
      return res.status(401).json({ message: "Unauthorized: Please login" });
    }

    if (user.role !== "PLATFORM_ADMIN") {
      // Check business lifecycle centrally so every tenant router rejects unavailable accounts.
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

    // Token issuance predating a password change cannot retain access to the account.
    const passwordChangedAtSeconds = user.passwordChangedAt
      ? Math.floor(user.passwordChangedAt.getTime() / 1000)
      : null;
    if (
      passwordChangedAtSeconds &&
      (!decodedToken.iat || decodedToken.iat < passwordChangedAtSeconds)
    ) {
      return res.status(401).json({ message: "Unauthorized: Please login" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Please login" });
  }
};

export { userAuth };
