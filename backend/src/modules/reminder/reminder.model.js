import mongoose from "mongoose";

export const REMINDER_STATUSES = [
  "PENDING",
  "SENT",
  "SKIPPED",
  "CANCELLED",
  "EXPIRED",
];

const reminderSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    type: {
      type: String,
      enum: ["APPOINTMENT"],
      required: true,
      default: "APPOINTMENT",
    },
    dueAt: {
      type: Date,
      required: true,
    },
    // A reminder cannot be actioned after its appointment starts.
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: REMINDER_STATUSES,
      required: true,
      default: "PENDING",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Terminal reminder history is retained before MongoDB's TTL monitor deletes it.
    purgeAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Lists one business's active reminders in the order staff should action them.
reminderSchema.index({ businessId: 1, status: 1, dueAt: 1 });
// Lazily expires one business's reminders after their appointment begins.
reminderSchema.index({ businessId: 1, status: 1, expiresAt: 1 });
// Ensures rescheduling can find a booking's pending reminder without crossing tenants.
reminderSchema.index({ businessId: 1, bookingId: 1, status: 1 });
// One booking has at most one active appointment reminder at a time.
reminderSchema.index(
  { businessId: 1, bookingId: 1, type: 1 },
  { unique: true, partialFilterExpression: { status: "PENDING" } },
);
// MongoDB deletes terminal reminders after their own future purge date.
reminderSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Reminder", reminderSchema);
