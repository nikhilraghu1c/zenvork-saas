import Reminder from "./reminder.model.js";

export const REMINDER_LEAD_TIME_MS = 24 * 60 * 60 * 1000;
export const REMINDER_RETENTION_DAYS = 45;

const retentionDate = (now) =>
  new Date(now.getTime() + REMINDER_RETENTION_DAYS * 24 * 60 * 60 * 1000);

const terminalUpdate = (status, now, resolvedBy = null) => ({
  status,
  resolvedAt: now,
  resolvedBy,
  purgeAt: retentionDate(now),
});

// Replaces the active reminder whenever a scheduled slot is first assigned or rescheduled.
const replacePendingAppointmentReminder = async ({
  businessId,
  bookingId,
  clientId,
  scheduledStartAt,
  resolvedBy,
  session,
}) => {
  const now = new Date();
  const queryOptions = session ? { session } : undefined;
  await Reminder.updateMany(
    { businessId, bookingId, status: "PENDING" },
    { $set: terminalUpdate("CANCELLED", now, resolvedBy) },
    queryOptions,
  );

  // Appointments created less than a day ahead become actionable immediately, never early.
  const dueAt = new Date(
    Math.max(scheduledStartAt.getTime() - REMINDER_LEAD_TIME_MS, now.getTime()),
  );
  await Reminder.create(
    [
      {
        businessId,
        bookingId,
        clientId,
        dueAt,
        expiresAt: scheduledStartAt,
      },
    ],
    queryOptions,
  );
};

// Closes any unsent reminder when the booking can no longer receive an appointment reminder.
const cancelPendingAppointmentReminders = async ({
  businessId,
  bookingId,
  resolvedBy,
  session,
}) => {
  const now = new Date();
  const queryOptions = session ? { session } : undefined;
  await Reminder.updateMany(
    { businessId, bookingId, status: "PENDING" },
    { $set: terminalUpdate("CANCELLED", now, resolvedBy) },
    queryOptions,
  );
};

// An early actual start ends reminder visibility without overwriting a recorded sent outcome.
const closeAppointmentReminderQueue = async ({
  businessId,
  bookingId,
  actualStartAt,
  resolvedBy,
  session,
}) => {
  const queryOptions = session ? { session } : undefined;
  await Reminder.updateMany(
    {
      businessId,
      bookingId,
      status: { $in: ["PENDING", "SENT"] },
      expiresAt: { $gt: actualStartAt },
    },
    { $set: { expiresAt: actualStartAt } },
    queryOptions,
  );
  await Reminder.updateMany(
    { businessId, bookingId, status: "PENDING" },
    { $set: terminalUpdate("CANCELLED", actualStartAt, resolvedBy) },
    queryOptions,
  );
};

// Request-time expiry keeps the manual queue accurate without a background worker.
const expirePendingReminders = async (businessId, now = new Date()) =>
  Reminder.updateMany(
    { businessId, status: "PENDING", expiresAt: { $lte: now } },
    { $set: terminalUpdate("EXPIRED", now) },
  );

export {
  cancelPendingAppointmentReminders,
  closeAppointmentReminderQueue,
  expirePendingReminders,
  replacePendingAppointmentReminder,
  retentionDate,
  terminalUpdate,
};
