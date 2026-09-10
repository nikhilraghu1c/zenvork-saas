import mongoose from "mongoose";

export class RequestValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "RequestValidationError";
  }
}

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

export const validateBusinessRegistration = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new RequestValidationError("Invalid request data");
  }

  const { businessName, businessTypeId, ownerName, email, mobile, password } = data;
  const errors = [];

  if (!isNonEmptyString(businessName)) {
    errors.push("Business name is required");
  }
  if (!isNonEmptyString(ownerName)) {
    errors.push("Owner name is required");
  }
  if (!isNonEmptyString(email)) {
    errors.push("Email is required");
  }
  if (!isNonEmptyString(mobile)) {
    errors.push("Mobile number is required");
  }
  if (typeof password !== "string" || password.length === 0) {
    errors.push("Password is required");
  }
  if (!isNonEmptyString(businessTypeId)) {
    errors.push("Business type is required");
  }

  if (errors.length > 0) {
    throw new RequestValidationError(errors[0]);
  }

  const normalizedBusinessTypeId = businessTypeId.trim();
  if (!mongoose.isObjectIdOrHexString(normalizedBusinessTypeId)) {
    throw new RequestValidationError("Invalid business type");
  }

  return {
    businessName: businessName.trim(),
    businessTypeId: normalizedBusinessTypeId,
    ownerName: ownerName.trim(),
    email: email.trim().toLowerCase(),
    mobile: mobile.trim(),
    password,
  };
};
