import { environment } from "../config/environment.js";
import jwt from "jsonwebtoken";
import User from "../modules/users/user.model.js";
import { getAccessibleBusiness } from "../modules/auth/auth-account.service.js";

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
    let business;
    try {
      // Re-check account and tenant lifecycle before every protected request.
      business = await getAccessibleBusiness(user);
    } catch (error) {
      return res.status(error.statusCode ?? 401).json({ message: error.message });
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
    req.business = business;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Please login" });
  }
};

export { userAuth };
