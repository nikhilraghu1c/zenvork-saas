import mongoose from "mongoose";

export class ResourceValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ResourceValidationError";
  }
}

// Treat whitespace-only strings as missing values.
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

export const validateResourceCreation = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ResourceValidationError("Invalid request data");
  }

  const allowedFields = ["name", "resourceType", "linkedUserId"];
  // Reject tenant-controlled or unexpected fields before resource creation.
  if (Object.keys(data).some((field) => !allowedFields.includes(field))) {
    throw new ResourceValidationError("Invalid request data");
  }

  const { name, resourceType, linkedUserId } = data;

  if (!isNonEmptyString(name)) {
    throw new ResourceValidationError("Resource name is required");
  }
  if (!isNonEmptyString(resourceType)) {
    throw new ResourceValidationError("Resource type is required");
  }

  const normalizedResourceType = resourceType.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9_]*$/.test(normalizedResourceType)) {
    throw new ResourceValidationError("Invalid resource type");
  }

  if (
    linkedUserId !== undefined &&
    linkedUserId !== null &&
    (typeof linkedUserId !== "string" || !mongoose.isObjectIdOrHexString(linkedUserId))
  ) {
    throw new ResourceValidationError("Invalid linked user");
  }

  return {
    name: name.trim(),
    resourceType: normalizedResourceType,
    linkedUserId: linkedUserId ? linkedUserId.trim() : null,
  };
};

// Restrict lifecycle changes to one boolean so this endpoint cannot become an accidental resource editor.
export const validateResourceStatusUpdate = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ResourceValidationError("Invalid request data");
  }

  if (Object.keys(data).length !== 1 || !Object.hasOwn(data, "isActive")) {
    throw new ResourceValidationError("Invalid request data");
  }

  if (typeof data.isActive !== "boolean") {
    throw new ResourceValidationError("Resource status must be active or inactive");
  }

  return { isActive: data.isActive };
};
