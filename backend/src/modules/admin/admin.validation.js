import mongoose from "mongoose";
import validator from "validator";

export class AdminValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AdminValidationError";
  }
}

const isText = (value) => typeof value === "string" && value.trim().length > 0;

// Admin creation accepts identity data only; the server generates the temporary owner password.
export const validateBusinessCreation = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new AdminValidationError("Invalid request data");
  }
  const allowedFields = [
    "businessName",
    "businessTypeId",
    "ownerName",
    "email",
    "mobile",
    "planExpiresAt",
  ];
  if (Object.keys(data).some((field) => !allowedFields.includes(field))) {
    throw new AdminValidationError("Invalid request data");
  }
  const {
    businessName,
    businessTypeId,
    ownerName,
    email,
    mobile,
    planExpiresAt = null,
  } = data;
  if (
    !isText(businessName) ||
    businessName.trim().length < 5 ||
    businessName.trim().length > 100
  ) {
    throw new AdminValidationError(
      "Business name must be between 5 and 100 characters",
    );
  }
  if (
    !isText(ownerName) ||
    ownerName.trim().length < 3 ||
    ownerName.trim().length > 50
  ) {
    throw new AdminValidationError(
      "Owner name must be between 3 and 50 characters",
    );
  }
  if (!isText(email) || !validator.isEmail(email.trim()))
    throw new AdminValidationError("Invalid owner email");
  if (!isText(mobile) || !/^[6-9]\d{9}$/.test(mobile.trim()))
    throw new AdminValidationError("Invalid owner mobile number");
  if (
    !isText(businessTypeId) ||
    !mongoose.isObjectIdOrHexString(businessTypeId.trim())
  ) {
    throw new AdminValidationError("Invalid business type");
  }
  const expiresAt = planExpiresAt === null ? null : new Date(planExpiresAt);
  if (planExpiresAt !== null && Number.isNaN(expiresAt.getTime()))
    throw new AdminValidationError("Invalid plan expiry date");
  return {
    businessName: businessName.trim(),
    businessTypeId: businessTypeId.trim(),
    ownerName: ownerName.trim(),
    email: email.trim().toLowerCase(),
    mobile: mobile.trim(),
    planExpiresAt: expiresAt,
  };
};

export const validateBusinessStatus = (data) => {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).length !== 1 ||
    !Object.hasOwn(data, "status") ||
    !["ACTIVE", "SUSPENDED"].includes(data.status)
  ) {
    throw new AdminValidationError(
      "Business status must be ACTIVE or SUSPENDED",
    );
  }
  return { status: data.status };
};

export const validatePlanExpiry = (data) => {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).length !== 1 ||
    !Object.hasOwn(data, "planExpiresAt")
  )
    throw new AdminValidationError("Invalid request data");
  if (data.planExpiresAt === null) return { planExpiresAt: null };
  const planExpiresAt = new Date(data.planExpiresAt);
  if (Number.isNaN(planExpiresAt.getTime()))
    throw new AdminValidationError("Invalid plan expiry date");
  return { planExpiresAt };
};
