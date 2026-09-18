export class ServiceValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ServiceValidationError";
  }
}

const validateName = (value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ServiceValidationError("Service name is required");
  }
  if (value.trim().length > 100) {
    throw new ServiceValidationError("Service name cannot exceed 100 characters");
  }
  return value.trim();
};

const validatePricePaise = (value) => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ServiceValidationError("Price must be a non-negative whole number of paise");
  }
  return value;
};

const validateDurationMinutes = (value) => {
  if (!Number.isSafeInteger(value) || value < 1 || value > 1440) {
    throw new ServiceValidationError(
      "Duration must be a whole number of minutes between 1 and 1440",
    );
  }
  return value;
};

const validateIsActive = (value) => {
  if (typeof value !== "boolean") {
    throw new ServiceValidationError("Active status must be true or false");
  }
  return value;
};

const assertPlainRequestData = (data, allowedFields, errorMessage) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ServiceValidationError("Invalid request data");
  }
  if (
    Object.keys(data).length === 0 ||
    Object.keys(data).some((field) => !allowedFields.includes(field))
  ) {
    throw new ServiceValidationError(errorMessage);
  }
};

export const validateServiceCreation = (data) => {
  assertPlainRequestData(
    data,
    ["name", "pricePaise", "durationMinutes"],
    "Invalid service data",
  );
  if (!("name" in data) || !("pricePaise" in data) || !("durationMinutes" in data)) {
    throw new ServiceValidationError("Service name, price, and duration are required");
  }
  return {
    name: validateName(data.name),
    pricePaise: validatePricePaise(data.pricePaise),
    durationMinutes: validateDurationMinutes(data.durationMinutes),
  };
};

export const validateServiceUpdate = (data) => {
  assertPlainRequestData(
    data,
    ["name", "pricePaise", "durationMinutes", "isActive"],
    "Invalid service update fields",
  );
  const hasName = Object.hasOwn(data, "name");
  const hasPricePaise = Object.hasOwn(data, "pricePaise");
  const hasDurationMinutes = Object.hasOwn(data, "durationMinutes");
  const hasIsActive = Object.hasOwn(data, "isActive");
  return {
    hasName,
    name: hasName ? validateName(data.name) : null,
    hasPricePaise,
    pricePaise: hasPricePaise ? validatePricePaise(data.pricePaise) : null,
    hasDurationMinutes,
    durationMinutes: hasDurationMinutes ? validateDurationMinutes(data.durationMinutes) : null,
    hasIsActive,
    isActive: hasIsActive ? validateIsActive(data.isActive) : null,
  };
};

export const validateServiceListQuery = (query) => {
  if (!query || typeof query !== "object" || Array.isArray(query)) {
    throw new ServiceValidationError("Invalid query parameters");
  }
  if (
    Object.keys(query).some((field) => field !== "active") ||
    Object.values(query).some((value) => Array.isArray(value) || typeof value === "object")
  ) {
    throw new ServiceValidationError("Invalid query parameters");
  }
  if (query.active === undefined) return {};
  if (query.active !== "true" && query.active !== "false") {
    throw new ServiceValidationError("Active must be true or false");
  }
  return { isActive: query.active === "true" };
};
