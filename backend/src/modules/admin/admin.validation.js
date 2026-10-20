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

const normalizeResourceTypeCode = (value) => {
  if (!isText(value)) throw new AdminValidationError("Resource type code is required");
  const code = value.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9_]*$/.test(code)) {
    throw new AdminValidationError(
      "Resource type code must use uppercase letters, numbers, or underscores",
    );
  }
  return code;
};

const normalizeResourceTypeName = (value) => {
  if (!isText(value) || value.trim().length > 50) {
    throw new AdminValidationError("Resource type name must be between 1 and 50 characters");
  }
  return value.trim();
};

const normalizeBusinessTypeCode = (value) => {
  if (!isText(value)) throw new AdminValidationError("Business type code is required");
  const code = value.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9_]*$/.test(code)) {
    throw new AdminValidationError(
      "Business type code must use uppercase letters, numbers, or underscores",
    );
  }
  return code;
};

const normalizeBusinessTypeName = (value) => {
  if (!isText(value) || value.trim().length > 50) {
    throw new AdminValidationError("Business type name must be between 1 and 50 characters");
  }
  return value.trim();
};

const normalizeBusinessTypeIcon = (value) => {
  if (value === undefined) return "business";
  if (!isText(value) || value.trim().length > 50 || !/^[a-z0-9_]+$/.test(value.trim())) {
    throw new AdminValidationError("Business type icon must use lowercase letters, numbers, or underscores");
  }
  return value.trim();
};

export const validateBusinessTypeCreation = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new AdminValidationError("Invalid request data");
  }
  const allowedFields = ["code", "name", "iconName"];
  if (Object.keys(data).some((field) => !allowedFields.includes(field))) {
    throw new AdminValidationError("Invalid request data");
  }
  return {
    code: normalizeBusinessTypeCode(data.code),
    name: normalizeBusinessTypeName(data.name),
    iconName: normalizeBusinessTypeIcon(data.iconName),
  };
};

export const validateBusinessTypeUpdate = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new AdminValidationError("Invalid request data");
  }
  const allowedFields = ["name", "iconName"];
  if (
    Object.keys(data).length === 0 ||
    Object.keys(data).some((field) => !allowedFields.includes(field))
  ) {
    throw new AdminValidationError("Invalid request data");
  }
  const update = {};
  if (Object.hasOwn(data, "name")) update.name = normalizeBusinessTypeName(data.name);
  if (Object.hasOwn(data, "iconName")) update.iconName = normalizeBusinessTypeIcon(data.iconName);
  return update;
};

export const validateBusinessTypeStatus = (data) => {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).length !== 1 ||
    !Object.hasOwn(data, "isActive") ||
    typeof data.isActive !== "boolean"
  ) {
    throw new AdminValidationError("Business type status must be active or inactive");
  }
  return { isActive: data.isActive };
};

// Resource types remain scoped to a business type, preserving the existing tenant configuration model.
export const validateResourceTypeCreation = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new AdminValidationError("Invalid request data");
  }
  const allowedFields = ["businessTypeId", "code", "name", "isPerson"];
  if (Object.keys(data).some((field) => !allowedFields.includes(field))) {
    throw new AdminValidationError("Invalid request data");
  }
  if (
    !isText(data.businessTypeId) ||
    !mongoose.isObjectIdOrHexString(data.businessTypeId.trim())
  ) {
    throw new AdminValidationError("Invalid business type");
  }
  if (typeof data.isPerson !== "boolean") {
    throw new AdminValidationError("Resource type must specify whether it represents a person");
  }
  return {
    businessTypeId: data.businessTypeId.trim(),
    code: normalizeResourceTypeCode(data.code),
    name: normalizeResourceTypeName(data.name),
    isPerson: data.isPerson,
  };
};

export const validateResourceTypeUpdate = (data) => {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).length !== 1 ||
    !Object.hasOwn(data, "name")
  ) {
    throw new AdminValidationError("Invalid request data");
  }
  return { name: normalizeResourceTypeName(data.name) };
};

export const validateResourceTypeStatus = (data) => {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).length !== 1 ||
    !Object.hasOwn(data, "isActive") ||
    typeof data.isActive !== "boolean"
  ) {
    throw new AdminValidationError("Resource type status must be active or inactive");
  }
  return { isActive: data.isActive };
};
