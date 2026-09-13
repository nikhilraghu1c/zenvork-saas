import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    resourceIds: {
      // A booking can reserve a person plus optional room, chair, or equipment.
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Resource",
        },
      ],
      default: [],
    },
    scheduledStartAt: {
      type: Date,
      default: null,
    },
    scheduledEndAt: {
      type: Date,
      default: null,
    },
    actualStartAt: {
      type: Date,
      default: null,
    },
    actualEndAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "SCHEDULED",
        "CHECKED_IN",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      default: "PENDING",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

bookingSchema.pre("validate", function () {
  // Only scheduled and in-progress lifecycle states require a planned time slot.
  const statusesRequiringSchedule = ["SCHEDULED", "CHECKED_IN", "COMPLETED"];

  if (Boolean(this.scheduledStartAt) !== Boolean(this.scheduledEndAt)) {
    this.invalidate(
      "scheduledEndAt",
      "Scheduled start and end times must both be provided",
    );
  }

  if (
    statusesRequiringSchedule.includes(this.status) &&
    (!this.scheduledStartAt || !this.scheduledEndAt)
  ) {
    this.invalidate(
      "scheduledStartAt",
      "Scheduled bookings require start and end times",
    );
  }

  if (
    this.scheduledStartAt &&
    this.scheduledEndAt &&
    this.scheduledEndAt <= this.scheduledStartAt
  ) {
    this.invalidate(
      "scheduledEndAt",
      "Scheduled end time must be after the start time",
    );
  }

  // Actual timestamps are recorded by the server during lifecycle transitions.
  if (this.status === "CHECKED_IN" && !this.actualStartAt) {
    this.invalidate(
      "actualStartAt",
      "Checked-in bookings require an actual start time",
    );
  }

  if (
    this.status === "COMPLETED" &&
    (!this.actualStartAt || !this.actualEndAt)
  ) {
    this.invalidate(
      "actualEndAt",
      "Completed bookings require actual start and end times",
    );
  }

  if (
    this.actualStartAt &&
    this.actualEndAt &&
    this.actualEndAt < this.actualStartAt
  ) {
    this.invalidate(
      "actualEndAt",
      "Actual end time cannot be before the actual start time",
    );
  }
});

// Supports tenant calendar views and resource-availability conflict checks.
bookingSchema.index({ businessId: 1, scheduledStartAt: 1 });
bookingSchema.index({ businessId: 1, resourceIds: 1, scheduledStartAt: 1 });

export default mongoose.model("Booking", bookingSchema);
