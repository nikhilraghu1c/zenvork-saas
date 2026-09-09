import { environment } from "../config/environment.js";
import jwt from "jsonwebtoken";
import User from "../modules/users/user.model.js";

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
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: Please login" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Please login" });
  }
};

export { userAuth };
