import { BUSINESS_TYPES } from "./business.model.js";

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

  const { businessName, businessType, ownerName, email, mobile, password } = data;
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
  if (!isNonEmptyString(businessType)) {
    errors.push("Business type is required");
  }

  if (errors.length > 0) {
    throw new RequestValidationError(errors[0]);
  }

  const normalizedBusinessType = businessType.trim().toUpperCase();
  if (!BUSINESS_TYPES.includes(normalizedBusinessType)) {
    throw new RequestValidationError("Invalid business type");
  }

  return {
    businessName: businessName.trim(),
    businessType: normalizedBusinessType,
    ownerName: ownerName.trim(),
    email: email.trim().toLowerCase(),
    mobile: mobile.trim(),
    password,
  };
};
