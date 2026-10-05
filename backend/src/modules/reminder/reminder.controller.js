import mongoose from "mongoose";
import Reminder from "./reminder.model.js";
import { expirePendingReminders, retentionDate } from "./reminder.lifecycle.js";
import {
  ReminderValidationError,
  validateReminderAction,
  validateReminderListQuery,
} from "./reminder.validation.js";
import { getBusinessDayRange } from "../../utils/reporting-period.js";
import { tenantFilter, tenantId } from "../../utils/tenant-scope.js";

// Separates due reminder work from the future preview using the server's current instant.
const pendingReminderFilter = (businessId, tab, now) => {
  const base = { businessId, status: "PENDING", expiresAt: { $gt: now } };
  return tab === "to-send"
    ? { ...base, dueAt: { $lte: now } }
    : { ...base, dueAt: { $gt: now } };
};

// Sent today is a daily confirmation log, so it intentionally remains visible after the appointment starts.
const sentTodayFilter = (businessId, startOfToday, startOfTomorrow) => ({
  businessId,
  status: "SENT",
  resolvedAt: { $gte: startOfToday, $lt: startOfTomorrow },
});

// Returns only the booking context staff needs to write or confirm an appointment reminder.
const toPublicReminder = (reminder) => ({
  _id: reminder._id,
  status: reminder.status,
  dueAt: reminder.dueAt,
  expiresAt: reminder.expiresAt,
  resolvedAt: reminder.resolvedAt,
  client: reminder.clientId
    ? {
        _id: reminder.clientId._id,
        name: reminder.clientId.name,
        mobile: reminder.clientId.mobile,
      }
    : null,
  booking: reminder.bookingId
    ? {
        _id: reminder.bookingId._id,
        scheduledStartAt: reminder.bookingId.scheduledStartAt,
        services: (reminder.bookingId.services ?? []).map(({ name }) => ({
          name,
        })),
        resources: (reminder.bookingId.resourceIds ?? []).map(
          ({ _id, name, resourceType }) => ({
            _id,
            name,
            resourceType,
          }),
        ),
      }
    : null,
});

const populateReminderContext = (query) =>
  query.populate("clientId", "name mobile").populate({
    path: "bookingId",
    select: "scheduledStartAt services resourceIds",
    populate: { path: "resourceIds", select: "name resourceType" },
  });

const getReminders = async (req, res) => {
  try {
    const { tab, page, limit } = validateReminderListQuery(req.query);
    const now = new Date();
    const businessId = tenantId(req);
    const { from: startOfToday, to: startOfTomorrow } =
      getBusinessDayRange(now);

    // Convert stale pending work before counts and list rows are calculated.
    await expirePendingReminders(businessId, now);

    const toSendFilter = pendingReminderFilter(businessId, "to-send", now);
    const upcomingFilter = pendingReminderFilter(businessId, "upcoming", now);
    const sentFilter = sentTodayFilter(
      businessId,
      startOfToday,
      startOfTomorrow,
    );
    const selectedFilter =
      tab === "sent-today"
        ? sentFilter
        : pendingReminderFilter(businessId, tab, now);
    const reminderSort =
      tab === "sent-today" ? { resolvedAt: -1, _id: -1 } : { dueAt: 1, _id: 1 };

    const [reminders, total, toSend, upcoming, sentToday] = await Promise.all([
      populateReminderContext(
        Reminder.find(selectedFilter)
          .sort(reminderSort)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
      ),
      Reminder.countDocuments(selectedFilter),
      Reminder.countDocuments(toSendFilter),
      Reminder.countDocuments(upcomingFilter),
      Reminder.countDocuments(sentFilter),
    ]);

    return res.status(200).json({
      reminders: reminders.map(toPublicReminder),
      counts: {
        toSend,
        upcoming,
        sentToday,
      },
      pagination: { page, limit, total },
    });
  } catch (error) {
    if (error instanceof ReminderValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Failed to retrieve reminders:", error);
    return res.status(500).json({ message: "Unable to retrieve reminders" });
  }
};

const updateReminderAction = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: "Invalid reminder" });
    }
    const action = validateReminderAction(req.body);
    const now = new Date();
    const businessId = tenantId(req);
    await expirePendingReminders(businessId, now);

    // Confirm tenant ownership before reporting a handled or expired active reminder.
    const existingReminder = await Reminder.findOne(
      tenantFilter(req, { _id: req.params.id }),
    ).select("status dueAt expiresAt");
    if (!existingReminder)
      return res.status(404).json({ message: "Reminder not found" });
    if (
      existingReminder.status !== "PENDING" ||
      existingReminder.expiresAt <= now
    ) {
      return res
        .status(409)
        .json({ message: "This reminder is no longer active" });
    }
    if (existingReminder.dueAt > now) {
      return res
        .status(409)
        .json({ message: "This reminder is not ready to send yet" });
    }

    const status = action === "sent" ? "SENT" : "SKIPPED";
    const reminder = await Reminder.findOneAndUpdate(
      tenantFilter(req, {
        _id: req.params.id,
        status: "PENDING",
        dueAt: { $lte: now },
        expiresAt: { $gt: now },
      }),
      {
        $set: {
          status,
          resolvedAt: now,
          resolvedBy: req.user._id,
          purgeAt: retentionDate(now),
        },
      },
      { new: true },
    ).lean();
    if (!reminder)
      return res
        .status(409)
        .json({ message: "This reminder is no longer active" });

    return res.status(200).json({
      message:
        action === "sent" ? "Reminder marked as sent" : "Reminder skipped",
      reminder: {
        _id: reminder._id,
        status: reminder.status,
        resolvedAt: reminder.resolvedAt,
      },
    });
  } catch (error) {
    if (error instanceof ReminderValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Failed to update reminder:", error);
    return res.status(500).json({ message: "Unable to update reminder" });
  }
};

export { getReminders, updateReminderAction };
