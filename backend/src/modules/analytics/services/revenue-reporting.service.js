import Booking from "../../booking/booking.model.js";
import { BUSINESS_TIME_ZONE } from "../../../utils/reporting-period.js";

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

// Builds filters from a caller-supplied, authenticated tenant ID rather than any client-provided value.
const completedFilter = (businessId, start, end) => ({
  businessId,
  status: "COMPLETED",
  actualEndAt: { $gte: start, $lt: end },
});

const collectedFilter = (businessId, start, end) => ({
  businessId,
  status: "COMPLETED",
  paymentStatus: "paid",
  paidAt: { $gte: start, $lt: end },
});

// Produces the API's complete reporting payload for a tenant and a server-validated reporting range.
const getRevenueAnalyticsReport = async ({ businessId, period, month, reportingRange }) => {
  const { from, to, previousFrom, previousTo } = reportingRange;
  const billedInRange = completedFilter(businessId, from, to);
  const collectedInRange = collectedFilter(businessId, from, to);
  const pendingPaymentInRange = {
    businessId,
    status: "COMPLETED",
    paymentStatus: "unpaid",
    actualEndAt: { $gte: from, $lt: to },
  };

  const [
    billed,
    previousBilled,
    collected,
    previousCollected,
    pendingPayment,
    extraCharges,
    billedDaily,
    collectedDaily,
    services,
  ] = await Promise.all([
    getAmountSummary(billedInRange),
    getAmountSummary(completedFilter(businessId, previousFrom, previousTo)),
    getAmountSummary(collectedInRange),
    getAmountSummary(collectedFilter(businessId, previousFrom, previousTo)),
    getAmountSummary(pendingPaymentInRange),
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

  return {
    period,
    month: month ?? null,
    range: { from, to },
    revenue: {
      billedPaise: billed.amountPaise,
      billedBookingsCount: billed.bookingsCount,
      previousBilledPaise: previousBilled.amountPaise,
      collectedPaise: collected.amountPaise,
      collectedBookingsCount: collected.bookingsCount,
      previousCollectedPaise: previousCollected.amountPaise,
      outstandingPaise: pendingPayment.amountPaise,
      outstandingBookingsCount: pendingPayment.bookingsCount,
      extraChargesPaise: extraCharges.amountPaise,
    },
    daily: [...dailyByDate.values()].sort((first, second) =>
      first.date.localeCompare(second.date),
    ),
    services,
  };
};

export { getRevenueAnalyticsReport };
