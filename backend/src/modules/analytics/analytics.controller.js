import Booking from "../booking/booking.model.js";
import { tenantFilter } from "../../utils/tenant-scope.js";
import {
  BUSINESS_TIME_ZONE,
  getReportingMonthRange,
  REPORTING_PERIODS,
  getReportingRange,
} from "../../utils/reporting-period.js";

// Sums a monetary field and count in MongoDB so reports never load the full tenant booking history.
const getAmountSummary = async (filter, amountField = "totalAmountPaise") => {
  const [summary] = await Booking.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        amountPaise: { $sum: `$${amountField}` },
        bookingsCount: { $sum: 1 },
      },
    },
  ]);
  return {
    amountPaise: summary?.amountPaise ?? 0,
    bookingsCount: summary?.bookingsCount ?? 0,
  };
};

// Buckets monetary records by a business calendar day, even though dates are stored as UTC instants.
const getDailyRevenue = (filter, dateField) =>
  Booking.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          $dateToString: {
            date: `$${dateField}`,
            format: "%Y-%m-%d",
            timezone: BUSINESS_TIME_ZONE,
          },
        },
        amountPaise: { $sum: "$totalAmountPaise" },
        bookingsCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: "$_id",
        amountPaise: 1,
        bookingsCount: 1,
      },
    },
  ]);

// Uses immutable line-item snapshots so catalogue edits never alter historical service revenue.
const getServiceRevenue = (filter) =>
  Booking.aggregate([
    { $match: filter },
    { $unwind: "$services" },
    {
      $group: {
        _id: "$services.serviceId",
        name: { $first: "$services.name" },
        revenuePaise: { $sum: "$services.pricePaise" },
        bookingsCount: { $sum: 1 },
      },
    },
    { $sort: { revenuePaise: -1, name: 1 } },
    { $project: { _id: 0, serviceId: "$_id", name: 1, revenuePaise: 1, bookingsCount: 1 } },
  ]);

const getRevenueAnalytics = async (req, res) => {
  try {
    const period = req.query.period ?? "month";
    const selectedMonth = req.query.month;
    // Analytics accepts fixed windows or one server-validated whole calendar month.
    if (typeof period !== "string" || !REPORTING_PERIODS.includes(period)) {
      return res.status(400).json({ message: "Period must be today, week, or month" });
    }
    if (selectedMonth !== undefined && (period !== "month" || typeof selectedMonth !== "string")) {
      return res.status(400).json({ message: "Month can only be used with the month period" });
    }

    const reportingRange =
      selectedMonth !== undefined ? getReportingMonthRange(selectedMonth) : getReportingRange(period);
    if (!reportingRange) {
      return res.status(400).json({ message: "Month must be within the current and previous 35 months" });
    }
    const { from, to, previousFrom, previousTo } = reportingRange;
    const completedFilter = (start, end) =>
      tenantFilter(req, {
        status: "COMPLETED",
        actualEndAt: { $gte: start, $lt: end },
      });
    const collectedFilter = (start, end) =>
      tenantFilter(req, {
        status: "COMPLETED",
        paymentStatus: "paid",
        paidAt: { $gte: start, $lt: end },
      });
    const billedInRange = completedFilter(from, to);
    const collectedInRange = collectedFilter(from, to);
    const outstandingInRange = tenantFilter(req, {
      status: "COMPLETED",
      paymentStatus: "unpaid",
      actualEndAt: { $gte: from, $lt: to },
    });

    const [
      billed,
      previousBilled,
      collected,
      previousCollected,
      outstanding,
      extraCharges,
      billedDaily,
      collectedDaily,
      services,
    ] = await Promise.all([
      getAmountSummary(billedInRange),
      getAmountSummary(completedFilter(previousFrom, previousTo)),
      getAmountSummary(collectedInRange),
      getAmountSummary(collectedFilter(previousFrom, previousTo)),
      getAmountSummary(outstandingInRange),
      getAmountSummary(billedInRange, "extraAmountPaise"),
      getDailyRevenue(billedInRange, "actualEndAt"),
      getDailyRevenue(collectedInRange, "paidAt"),
      getServiceRevenue(billedInRange),
    ]);

    const dailyByDate = new Map();
    for (const day of billedDaily) {
      dailyByDate.set(day.date, {
        date: day.date,
        billedPaise: day.amountPaise,
        billedBookingsCount: day.bookingsCount,
        collectedPaise: 0,
        collectedBookingsCount: 0,
      });
    }
    for (const day of collectedDaily) {
      const current = dailyByDate.get(day.date) ?? {
        date: day.date,
        billedPaise: 0,
        billedBookingsCount: 0,
        collectedPaise: 0,
        collectedBookingsCount: 0,
      };
      current.collectedPaise = day.amountPaise;
      current.collectedBookingsCount = day.bookingsCount;
      dailyByDate.set(day.date, current);
    }

    return res.status(200).json({
      analytics: {
        period,
        month: selectedMonth ?? null,
        range: { from, to },
        revenue: {
          billedPaise: billed.amountPaise,
          billedBookingsCount: billed.bookingsCount,
          previousBilledPaise: previousBilled.amountPaise,
          collectedPaise: collected.amountPaise,
          collectedBookingsCount: collected.bookingsCount,
          previousCollectedPaise: previousCollected.amountPaise,
          outstandingPaise: outstanding.amountPaise,
          outstandingBookingsCount: outstanding.bookingsCount,
          extraChargesPaise: extraCharges.amountPaise,
        },
        daily: [...dailyByDate.values()].sort((first, second) =>
          first.date.localeCompare(second.date),
        ),
        services,
      },
    });
  } catch (error) {
    console.error("Failed to load revenue analytics:", error);
    return res.status(500).json({ message: "Unable to load revenue analytics" });
  }
};

export { getRevenueAnalytics };
