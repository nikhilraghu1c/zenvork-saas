import Booking from "../../booking/booking.model.js";
import {
  AssistantToolAuthorizationError,
  AssistantToolValidationError,
} from "./assistant-tool.errors.js";

const MAX_APPOINTMENT_AGENDA_ITEMS = 20;

// Converts an ISO calendar date into the UTC boundaries of that date in Zenvork's business timezone.
const getBusinessDayRangeForDate = (dateValue) => {
  if (typeof dateValue !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) return null;

  const [year, month, day] = match.slice(1).map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    return null;
  }

  const from = new Date(Date.UTC(year, month - 1, day, -5, -30));
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 1);
  return { from, to };
};

// Reads only the agenda fields needed for the authenticated tenant's selected business day.
const getAppointmentAgenda = async ({ businessId, userRole, date }) => {
  if (!["OWNER", "STAFF"].includes(userRole)) {
    throw new AssistantToolAuthorizationError("You do not have access to appointment information");
  }

  const businessDayRange = getBusinessDayRangeForDate(date);
  if (!businessDayRange) {
    throw new AssistantToolValidationError("Please provide a valid appointment date");
  }

  // Include every scheduled interval that occupies the requested business day.
  const appointments = await Booking.find({
    businessId,
    scheduledStartAt: { $lt: businessDayRange.to },
    scheduledEndAt: { $gt: businessDayRange.from },
  })
    .select("clientId resourceIds scheduledStartAt scheduledEndAt services status")
    .populate("clientId", "name")
    .populate("resourceIds", "name resourceType")
    .sort({ scheduledStartAt: 1, _id: 1 })
    .limit(MAX_APPOINTMENT_AGENDA_ITEMS + 1)
    .lean();

  const hasMore = appointments.length > MAX_APPOINTMENT_AGENDA_ITEMS;
  return {
    date,
    hasMore,
    appointments: appointments.slice(0, MAX_APPOINTMENT_AGENDA_ITEMS).map((appointment) => ({
      scheduledStartAt: appointment.scheduledStartAt,
      scheduledEndAt: appointment.scheduledEndAt,
      clientName: appointment.clientId?.name ?? "Unknown client",
      serviceNames: (appointment.services ?? []).map((service) => service.name),
      status: appointment.status,
      resources: (appointment.resourceIds ?? [])
        .filter(Boolean)
        .map((resource) => ({ name: resource.name, type: resource.resourceType })),
    })),
  };
};

export { getAppointmentAgenda };
