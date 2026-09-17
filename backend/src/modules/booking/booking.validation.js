import mongoose from "mongoose";
import {
  ClientValidationError,
  validateClientCreation,
} from "../client/client.validation.js";

const BOOKING_STATUSES = [
  "PENDING",
  "SCHEDULED",
  "CHECKED_IN",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];
const SORT_FIELDS = ["scheduledStartAt", "createdAt", "updatedAt"];

export class BookingValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "BookingValidationError";
  }
}

const isValidObjectId = (value) =>
  typeof value === "string" && mongoose.isObjectIdOrHexString(value);

// Require an explicit offset so a browser or server timezone cannot change the booking time.
const parseDateTime = (value, fieldName) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T.+(Z|[+-]\d{2}:\d{2})$/.test(value)
  ) {
    throw new BookingValidationError(
      `${fieldName} must be an ISO date-time with a timezone`,
    );
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BookingValidationError(`Invalid ${fieldName}`);
  }

  return date;
};

const parsePositiveInteger = (value, fieldName, defaultValue, maximum) => {
  if (value === undefined) return defaultValue;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw new BookingValidationError(`Invalid ${fieldName}`);
  }

  const number = Number(value);
  if (number > maximum) {
    throw new BookingValidationError(`${fieldName} cannot exceed ${maximum}`);
  }

  return number;
};

export const validateBookingCreation = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new BookingValidationError("Invalid request data");
  }

  const allowedFields = [
    "clientId",
    "client",
    "resourceIds",
    "scheduledStartAt",
    "scheduledEndAt",
    "notes",
  ];
  // Status, tenant identity, creator, and actual times are server-controlled.
  if (Object.keys(data).some((field) => !allowedFields.includes(field))) {
    throw new BookingValidationError("Invalid request data");
  }

  const {
    clientId,
    client,
    resourceIds = [],
    scheduledStartAt,
    scheduledEndAt,
    notes,
  } = data;
  const hasClientId = clientId !== undefined && clientId !== null;
  const hasNewClient = client !== undefined && client !== null;
  // Empty or whitespace-only client objects do not count as new client details.
  const hasNewClientDetails =
    hasNewClient &&
    typeof client === "object" &&
    !Array.isArray(client) &&
    Object.values(client).some(
      (value) => typeof value === "string" && value.trim().length > 0,
    );

  // Booking forms either select an existing client or create one in the same submission.
  if (hasClientId === hasNewClient) {
    throw new BookingValidationError(
      "Provide either an existing client or new client details",
    );
  }
  if (hasClientId && !isValidObjectId(clientId)) {
    throw new BookingValidationError("Invalid client");
  }
  if (hasNewClient && !hasNewClientDetails) {
    throw new BookingValidationError("New client details are required");
  }

  let newClient = null;
  if (hasNewClient) {
    try {
      newClient = validateClientCreation(client);
    } catch (error) {
      if (error instanceof ClientValidationError) {
        throw new BookingValidationError(error.message);
      }
      throw error;
    }
  }
  if (
    !Array.isArray(resourceIds) ||
    resourceIds.some((resourceId) => !isValidObjectId(resourceId))
  ) {
    throw new BookingValidationError("Invalid resources");
  }
  if (new Set(resourceIds).size !== resourceIds.length) {
    throw new BookingValidationError(
      "Resources cannot be selected more than once",
    );
  }
  if (
    notes !== undefined &&
    (typeof notes !== "string" || notes.trim().length > 1000)
  ) {
    throw new BookingValidationError(
      "Notes must be text and cannot exceed 1000 characters",
    );
  }

  const hasScheduledStart =
    scheduledStartAt !== undefined && scheduledStartAt !== null;
  const hasScheduledEnd =
    scheduledEndAt !== undefined && scheduledEndAt !== null;
  if (hasScheduledStart !== hasScheduledEnd) {
    throw new BookingValidationError(
      "Scheduled start and end times must both be provided",
    );
  }

  const startAt = hasScheduledStart
    ? parseDateTime(scheduledStartAt, "scheduled start time")
    : null;
  const endAt = hasScheduledEnd
    ? parseDateTime(scheduledEndAt, "scheduled end time")
    : null;
  if (startAt && endAt && endAt <= startAt) {
    throw new BookingValidationError(
      "Scheduled end time must be after the start time",
    );
  }

  return {
    clientId: hasClientId ? clientId : null,
    client: newClient,
    resourceIds,
    scheduledStartAt: startAt,
    scheduledEndAt: endAt,
    status: startAt ? "SCHEDULED" : "PENDING",
    notes: notes?.trim() || "",
  };
};

export const validateBookingStatusUpdate = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new BookingValidationError("Invalid request data");
  }

  const allowedFields = ["status", "resourceIds"];
  // Check-in may atomically assign resources; all other lifecycle changes accept only status.
  if (
    !("status" in data) ||
    Object.keys(data).some((field) => !allowedFields.includes(field))
  ) {
    throw new BookingValidationError("Invalid status update fields");
  }
  if (typeof data.status !== "string" || !BOOKING_STATUSES.includes(data.status)) {
    throw new BookingValidationError("Invalid booking status");
  }

  const hasResourceIds = Object.hasOwn(data, "resourceIds");
  if (data.status !== "CHECKED_IN" && hasResourceIds) {
    throw new BookingValidationError("Resources can only be assigned while checking in");
  }
  if (data.status === "CHECKED_IN" && !hasResourceIds) {
    throw new BookingValidationError("Assign at least one resource before checking in");
  }
  if (
    hasResourceIds &&
    (!Array.isArray(data.resourceIds) ||
      data.resourceIds.length === 0 ||
      data.resourceIds.some((resourceId) => !isValidObjectId(resourceId)))
  ) {
    throw new BookingValidationError("Select at least one valid resource");
  }
  if (hasResourceIds && new Set(data.resourceIds).size !== data.resourceIds.length) {
    throw new BookingValidationError(
      "Resources cannot be selected more than once",
    );
  }

  return {
    status: data.status,
    resourceIds: hasResourceIds ? data.resourceIds : [],
  };
};

export const validateBookingUpdate = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new BookingValidationError("Invalid request data");
  }

  const allowedFields = [
    "clientId",
    "resourceIds",
    "scheduledStartAt",
    "scheduledEndAt",
    "notes",
  ];
  // Lifecycle fields and actual times are always controlled by their dedicated server flows.
  if (
    Object.keys(data).length === 0 ||
    Object.keys(data).some((field) => !allowedFields.includes(field))
  ) {
    throw new BookingValidationError("Invalid booking update fields");
  }

  const hasClientId = Object.hasOwn(data, "clientId");
  const hasResourceIds = Object.hasOwn(data, "resourceIds");
  const hasScheduledStart = Object.hasOwn(data, "scheduledStartAt");
  const hasScheduledEnd = Object.hasOwn(data, "scheduledEndAt");
  const hasNotes = Object.hasOwn(data, "notes");

  // A time range is only valid when both ends are intentionally updated together.
  if (hasScheduledStart !== hasScheduledEnd) {
    throw new BookingValidationError(
      "Scheduled start and end times must both be provided",
    );
  }
  if (hasClientId && !isValidObjectId(data.clientId)) {
    throw new BookingValidationError("Invalid client");
  }
  if (
    hasResourceIds &&
    (!Array.isArray(data.resourceIds) ||
      data.resourceIds.some((resourceId) => !isValidObjectId(resourceId)))
  ) {
    throw new BookingValidationError("Invalid resources");
  }
  if (
    hasResourceIds &&
    new Set(data.resourceIds).size !== data.resourceIds.length
  ) {
    throw new BookingValidationError(
      "Resources cannot be selected more than once",
    );
  }
  if (
    hasNotes &&
    (typeof data.notes !== "string" || data.notes.trim().length > 1000)
  ) {
    throw new BookingValidationError(
      "Notes must be text and cannot exceed 1000 characters",
    );
  }

  const scheduledStartAt = hasScheduledStart
    ? parseDateTime(data.scheduledStartAt, "scheduled start time")
    : null;
  const scheduledEndAt = hasScheduledEnd
    ? parseDateTime(data.scheduledEndAt, "scheduled end time")
    : null;
  if (scheduledStartAt && scheduledEndAt && scheduledEndAt <= scheduledStartAt) {
    throw new BookingValidationError(
      "Scheduled end time must be after the start time",
    );
  }

  return {
    hasClientId,
    clientId: hasClientId ? data.clientId : null,
    hasResourceIds,
    resourceIds: hasResourceIds ? data.resourceIds : null,
    hasSchedule: hasScheduledStart,
    scheduledStartAt,
    scheduledEndAt,
    hasNotes,
    notes: hasNotes ? data.notes.trim() : null,
  };
};

export const validateBookingListQuery = (query) => {
  if (!query || typeof query !== "object" || Array.isArray(query)) {
    throw new BookingValidationError("Invalid query parameters");
  }

  // Only supported list controls may shape the tenant-scoped booking query.
  const allowedFields = [
    "from",
    "to",
    "status",
    "resourceId",
    "assignment",
    "clientId",
    "page",
    "limit",
    "sortBy",
    "order",
  ];
  if (Object.keys(query).some((field) => !allowedFields.includes(field))) {
    throw new BookingValidationError("Invalid query parameters");
  }
  if (
    Object.values(query).some(
      (value) => Array.isArray(value) || typeof value === "object",
    )
  ) {
    throw new BookingValidationError("Invalid query parameters");
  }

  const {
    from,
    to,
    status,
    resourceId,
    assignment,
    clientId,
    page,
    limit,
    sortBy,
    order,
  } = query;
  const fromDate = from === undefined ? null : parseDateTime(from, "from date");
  const toDate = to === undefined ? null : parseDateTime(to, "to date");

  if (fromDate && toDate && toDate <= fromDate) {
    throw new BookingValidationError("To date must be after from date");
  }

  if (resourceId !== undefined && !isValidObjectId(resourceId)) {
    throw new BookingValidationError("Invalid resource");
  }

  if (clientId !== undefined && !isValidObjectId(clientId)) {
    throw new BookingValidationError("Invalid client");
  }

  // Assignment distinguishes resource work queues from unassigned pending work.
  if (
    assignment !== undefined &&
    !["assigned", "unassigned"].includes(assignment)
  ) {
    throw new BookingValidationError("Invalid assignment filter");
  }

  if (assignment === "unassigned" && resourceId !== undefined) {
    throw new BookingValidationError(
      "An unassigned booking cannot have a resource filter",
    );
  }

  if (sortBy !== undefined && !SORT_FIELDS.includes(sortBy)) {
    throw new BookingValidationError("Invalid sort field");
  }

  if (order !== undefined && !["asc", "desc"].includes(order)) {
    throw new BookingValidationError("Invalid sort order");
  }

  const statuses =
    status === undefined ? [] : status.split(",").filter(Boolean);
  if (
    (status !== undefined && statuses.length === 0) ||
    statuses.some(
      (bookingStatus) => !BOOKING_STATUSES.includes(bookingStatus),
    ) ||
    new Set(statuses).size !== statuses.length
  ) {
    throw new BookingValidationError("Invalid status filter");
  }

  // Build only allow-listed MongoDB criteria from validated query parameters.
  const filter = {};
  if (fromDate || toDate) {
    filter.scheduledStartAt = {
      ...(fromDate && { $gte: fromDate }),
      ...(toDate && { $lt: toDate }),
    };
  }
  if (statuses.length > 0) filter.status = { $in: statuses };
  if (resourceId) filter.resourceIds = resourceId;
  if (clientId) filter.clientId = clientId;
  if (assignment === "assigned") filter["resourceIds.0"] = { $exists: true };
  if (assignment === "unassigned") filter.resourceIds = { $size: 0 };

  // Pending work is a FIFO task queue; calendar results are chronological by default.
  const defaultSortBy =
    statuses.length === 1 && statuses[0] === "PENDING"
      ? "createdAt"
      : "scheduledStartAt";
  const selectedSortBy = sortBy ?? defaultSortBy;
  const direction = order === "desc" ? -1 : 1;
  const sort =
    selectedSortBy === "createdAt"
      ? { createdAt: direction }
      : { [selectedSortBy]: direction, createdAt: direction };

  return {
    filter,
    sort,
    page: parsePositiveInteger(page, "page", 1, 1000000),
    limit: parsePositiveInteger(limit, "limit", 50, 100),
  };
};
