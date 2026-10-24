import mongoose from "mongoose";
import Booking from "../../booking/booking.model.js";
import { getBusinessDateParts, getBusinessDayRange } from "../../../utils/reporting-period.js";
import { AssistantToolAuthorizationError } from "./assistant-tool.errors.js";

const toBusinessDate = (date) => {
  const { year, month, day } = getBusinessDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

// Calculates tenant-scoped operational counts from bookings occupying today's business-day range.
const getTodayAppointmentSummary = async ({ businessId, userRole, now = new Date() }) => {
  if (!["OWNER", "STAFF"].includes(userRole)) {
    throw new AssistantToolAuthorizationError("You do not have access to appointment information");
  }

  const businessDayRange = getBusinessDayRange(now);
  const [summary] = await Booking.aggregate([
    {
      $match: {
        businessId: new mongoose.Types.ObjectId(businessId),
        scheduledStartAt: { $lt: businessDayRange.to },
        scheduledEndAt: { $gt: businessDayRange.from },
      },
    },
    {
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        pendingCount: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
        scheduledCount: { $sum: { $cond: [{ $eq: ["$status", "SCHEDULED"] }, 1, 0] } },
        checkedInCount: { $sum: { $cond: [{ $eq: ["$status", "CHECKED_IN"] }, 1, 0] } },
        completedCount: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } },
        cancelledCount: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } },
        noShowCount: { $sum: { $cond: [{ $eq: ["$status", "NO_SHOW"] }, 1, 0] } },
        remainingCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ["$status", ["PENDING", "SCHEDULED"]] },
                  { $gt: ["$scheduledStartAt", now] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return {
    date: toBusinessDate(now),
    totalCount: summary?.totalCount ?? 0,
    pendingCount: summary?.pendingCount ?? 0,
    scheduledCount: summary?.scheduledCount ?? 0,
    checkedInCount: summary?.checkedInCount ?? 0,
    completedCount: summary?.completedCount ?? 0,
    cancelledCount: summary?.cancelledCount ?? 0,
    noShowCount: summary?.noShowCount ?? 0,
    remainingCount: summary?.remainingCount ?? 0,
  };
};

export { getTodayAppointmentSummary };
