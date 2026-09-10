import validator from "validator";

export class UserValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "UserValidationError";
  }
}

// Treat whitespace-only strings as missing values.
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

export const validateStaffCreation = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new UserValidationError("Invalid request data");
  }

  const allowedFields = ["name", "email", "mobile", "password"];
  // The owner cannot choose a role or tenant through this endpoint.
  if (Object.keys(data).some((field) => !allowedFields.includes(field))) {
    throw new UserValidationError("Invalid request data");
  }

  const { name, email, mobile, password } = data;

  if (!isNonEmptyString(name)) {
    throw new UserValidationError("Staff name is required");
  }
  if (name.trim().length < 3 || name.trim().length > 50) {
    throw new UserValidationError("Staff name must be between 3 and 50 characters");
  }
  if (!isNonEmptyString(mobile)) {
    throw new UserValidationError("Mobile number is required");
  }
  if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
    throw new UserValidationError("Please provide a valid 10-digit mobile number");
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    throw new UserValidationError("Password must be between 8 and 128 characters");
  }

  if (email !== undefined && email !== null && !isNonEmptyString(email)) {
    throw new UserValidationError("Please provide a valid email address");
  }

  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail && !validator.isEmail(normalizedEmail)) {
    throw new UserValidationError("Please provide a valid email address");
  }

  return {
    name: name.trim(),
    email: normalizedEmail || undefined,
    mobile: mobile.trim(),
    password,
  };
};
