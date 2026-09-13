import validator from "validator";

export class ClientValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ClientValidationError";
  }
}

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

export const validateClientCreation = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ClientValidationError("Invalid request data");
  }

  const allowedFields = ["name", "mobile", "email", "notes"];
  if (Object.keys(data).some((field) => !allowedFields.includes(field))) {
    throw new ClientValidationError("Invalid request data");
  }

  const { name, mobile, email, notes } = data;

  if (
    !isNonEmptyString(name) ||
    name.trim().length < 3 ||
    name.trim().length > 50
  ) {
    throw new ClientValidationError(
      "Client name must be between 3 and 50 characters",
    );
  }
  if (!isNonEmptyString(mobile) || !/^[6-9]\d{9}$/.test(mobile.trim())) {
    throw new ClientValidationError(
      "Please provide a valid 10-digit Indian mobile number",
    );
  }
  if (email !== undefined && email !== null && !isNonEmptyString(email)) {
    throw new ClientValidationError("Please provide a valid email address");
  }
  if (email !== undefined && email !== null && typeof email !== "string") {
    throw new ClientValidationError("Please provide a valid email address");
  }

  const normalizedEmail = email?.trim().toLowerCase();
  if (
    normalizedEmail &&
    (normalizedEmail.length > 255 || !validator.isEmail(normalizedEmail))
  ) {
    throw new ClientValidationError("Please provide a valid email address");
  }
  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    throw new ClientValidationError("Notes must be text");
  }
  if (notes?.trim().length > 500) {
    throw new ClientValidationError("Notes cannot exceed 500 characters");
  }

  return {
    name: name.trim(),
    mobile: mobile.trim(),
    email: normalizedEmail || undefined,
    notes: notes?.trim() || undefined,
  };
};
