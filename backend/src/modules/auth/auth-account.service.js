import jwt from "jsonwebtoken";
import Business from "../business/business.model.js";
import { environment } from "../../config/environment.js";

/** Raises an HTTP-ready error when a user or their tenant can no longer receive a session. */
const getAccessibleBusiness = async (user) => {
  if (!user || user.isActive === false) {
    const error = new Error("Unauthorized: Please login");
    error.statusCode = 401;
    throw error;
  }

  if (user.role === "PLATFORM_ADMIN") {
    return null;
  }

  const business = await Business.findById(user.businessId)
    .select("name status planExpiresAt")
    .lean();
  const isExpired = business?.planExpiresAt && business.planExpiresAt.getTime() < Date.now();
  if (!business || business.status !== "ACTIVE" || isExpired) {
    const error = new Error("Business account is unavailable. Please contact support.");
    error.statusCode = 403;
    throw error;
  }

  return business;
};

/** Issues only short-lived access JWTs; durable login state is held by refresh sessions. */
const createAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      businessId: user.businessId?.toString() ?? null,
      role: user.role,
    },
    environment.ACCESS_TKN_SECRET,
    { expiresIn: environment.ACCESS_TKN_EXPIRE },
  );
};

/** Produces the safe browser metadata shared by login, refresh, and session recovery responses. */
const authenticatedUserResponse = (user, business) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email ?? null,
    mobile: user.mobile,
    role: user.role,
    businessId: user.businessId ?? null,
    businessName: user.role === "PLATFORM_ADMIN" ? null : business.name,
    bookingAccessScope: user.role === "OWNER" ? "ALL" : (user.bookingAccessScope ?? "NONE"),
    canSendReminders: user.role === "OWNER" || user.canSendReminders === true,
    passwordChangedAt: user.passwordChangedAt,
  };
};

export { getAccessibleBusiness, createAccessToken, authenticatedUserResponse };
