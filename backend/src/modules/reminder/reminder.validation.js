const REMINDER_TABS = ["to-send", "upcoming", "sent-today"];
const REMINDER_ACTIONS = ["sent", "skipped"];

export class ReminderValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ReminderValidationError";
  }
}

const parsePositiveInteger = (value, fieldName, defaultValue, maximum) => {
  if (value === undefined) return defaultValue;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw new ReminderValidationError(`Invalid ${fieldName}`);
  }
  const number = Number(value);
  if (number > maximum) {
    throw new ReminderValidationError(`${fieldName} cannot exceed ${maximum}`);
  }
  return number;
};

export const validateReminderListQuery = (query) => {
  if (!query || typeof query !== "object" || Array.isArray(query)) {
    throw new ReminderValidationError("Invalid query parameters");
  }
  const allowedFields = ["tab", "page", "limit"];
  if (
    Object.keys(query).some((field) => !allowedFields.includes(field)) ||
    Object.values(query).some(
      (value) => Array.isArray(value) || typeof value === "object",
    )
  ) {
    throw new ReminderValidationError("Invalid query parameters");
  }

  const { tab = "to-send", page, limit } = query;
  if (typeof tab !== "string" || !REMINDER_TABS.includes(tab)) {
    throw new ReminderValidationError(
      "Reminder tab must be to-send, upcoming, or sent-today",
    );
  }
  return {
    tab,
    page: parsePositiveInteger(page, "page", 1, 1000000),
    limit: parsePositiveInteger(limit, "limit", 25, 100),
  };
};

export const validateReminderAction = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ReminderValidationError("Invalid reminder action");
  }
  if (
    Object.keys(data).length !== 1 ||
    !Object.hasOwn(data, "action") ||
    typeof data.action !== "string" ||
    !REMINDER_ACTIONS.includes(data.action)
  ) {
    throw new ReminderValidationError("Action must be sent or skipped");
  }
  return data.action;
};
