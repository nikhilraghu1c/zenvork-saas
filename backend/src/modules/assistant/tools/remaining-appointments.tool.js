import { getTodayAppointmentSummary } from "./today-appointment-summary.tool.js";

// Keeps the remaining-appointments route independent while sharing the daily aggregate query.
const getRemainingAppointmentsToday = async ({ businessId, userRole, now = new Date() }) => {
  const summary = await getTodayAppointmentSummary({ businessId, userRole, now });
  return { date: summary.date, remainingCount: summary.remainingCount };
};

export { getRemainingAppointmentsToday };
