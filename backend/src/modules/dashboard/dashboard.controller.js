import Booking from "../booking/booking.model.js";
import Business from "../business/business.model.js";
import BusinessType from "../business/business-type.model.js";
import Resource from "../resource/resource.model.js";
import { tenantFilter, tenantId } from "../../utils/tenant-scope.js";

const PERIODS = ["today", "week", "month"];
const BUSINESS_TIME_ZONE = "Asia/Kolkata";

// Extracts a calendar date in the business timezone instead of using the server's local timezone.
const getDateParts = (date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
};

// Converts an India calendar day into its UTC start instant (midnight IST is 18:30 UTC the day before).
const startOfIndianDay = (date) => {
  const { year, month, day } = getDateParts(date);
  // Zenvork currently operates in India; tenant time zones can replace this fixed business boundary later.
  return new Date(Date.UTC(year, month - 1, day, -5, -30));
};

// Builds the selected reporting window and the immediately preceding equal-length comparison window.
const getRange = (period) => {
  const now = new Date();
  const { year, month, day } = getDateParts(now);
  const localCalendarDate = new Date(Date.UTC(year, month - 1, day));
  let from = startOfIndianDay(localCalendarDate);
  let to = new Date(from);

  if (period === "today") to.setUTCDate(to.getUTCDate() + 1);
  if (period === "week") {
    const indiaDay = (localCalendarDate.getUTCDay() + 6) % 7;
    localCalendarDate.setUTCDate(localCalendarDate.getUTCDate() - indiaDay);
    from = startOfIndianDay(localCalendarDate);
    to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 7);
  }
  if (period === "month") {
    localCalendarDate.setUTCDate(1);
    from = startOfIndianDay(localCalendarDate);
    localCalendarDate.setUTCMonth(localCalendarDate.getUTCMonth() + 1);
    to = startOfIndianDay(localCalendarDate);
  }

  const previousFrom = new Date(from);
  previousFrom.setTime(from.getTime() - (to.getTime() - from.getTime()));
  return { from, to, previousFrom, previousTo: new Date(from) };
};

// Aggregation lets MongoDB sum completed booking totals without loading every booking into Node.js.
const countCompletedRevenue = async (req, from, to) => {
  const [result] = await Booking.aggregate([
    // First retain only this tenant's bookings completed inside the requested reporting window.
    {
      $match: tenantFilter(req, {
        status: "COMPLETED",
        actualEndAt: { $gte: from, $lt: to },
      }),
    },
    // Then add their immutable booking total; $group produces one result document for the whole tenant.
    { $group: { _id: null, totalAmountPaise: { $sum: "$totalAmountPaise" } } },
  ]);
  return result?.totalAmountPaise ?? 0;
};

// Uses booking service snapshots so catalog price changes cannot rewrite historical service revenue.
const getTopServicesByRevenue = (req, from, to) =>
  Booking.aggregate([
    {
      $match: tenantFilter(req, {
        status: "COMPLETED",
        actualEndAt: { $gte: from, $lt: to },
      }),
    },
    // One booking can contain several services, so $unwind creates one revenue row per service line item.
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
    { $limit: 3 },
    {
      $project: {
        _id: 0,
        serviceId: "$_id",
        name: 1,
        revenuePaise: 1,
        bookingsCount: 1,
      },
    },
  ]);

// Ranks only configured person resources, preventing rooms or equipment from appearing as top staff.
const getTopStaffByCompletedBookings = async (req, from, to, personTypes) => {
  // Resolve eligible staff first so high-volume chairs or rooms cannot displace them from the top three.
  const staffResources = await Resource.find(
    tenantFilter(req, { isActive: true, resourceType: { $in: personTypes } }),
  )
    .select("name resourceType")
    .lean();
  if (staffResources.length === 0) return [];
  const staffIds = staffResources.map((resource) => resource._id);
  const totals = await Booking.aggregate([
    {
      $match: tenantFilter(req, {
        status: "COMPLETED",
        actualEndAt: { $gte: from, $lt: to },
        resourceIds: { $in: staffIds },
      }),
    },
    // One completed booking contributes once to every person resource assigned to it.
    { $unwind: "$resourceIds" },
    // The first match selects matching bookings; this second one removes their non-person resources.
    { $match: { resourceIds: { $in: staffIds } } },
    { $group: { _id: "$resourceIds", bookingsCount: { $sum: 1 } } },
    { $sort: { bookingsCount: -1 } },
    { $limit: 3 },
  ]);
  const staffById = new Map(
    staffResources.map((resource) => [resource._id.toString(), resource]),
  );

  return totals
    .map((total) => {
      const resource = staffById.get(total._id.toString());
      return resource
        ? {
            resourceId: resource._id,
            name: resource.name,
            resourceType: resource.resourceType,
            bookingsCount: total.bookingsCount,
          }
        : null;
    })
    .filter(Boolean);
};

const getDashboardSummary = async (req, res) => {
  try {
    const period = req.query.period ?? "today";
    // Reject arrays or other malformed query values instead of treating them as the default period.
    if (typeof period !== "string" || !PERIODS.includes(period)) {
      return res
        .status(400)
        .json({ message: "Period must be today, week, or month" });
    }

    const { from, to, previousFrom, previousTo } = getRange(period);
    // Appointment volume follows the planned calendar, even before a booking is completed.
    const scheduledFilter = tenantFilter(req, {
      scheduledStartAt: { $gte: from, $lt: to },
    });
    const completedFilter = tenantFilter(req, {
      status: "COMPLETED",
      actualEndAt: { $gte: from, $lt: to },
    });
    // Status history preserves when completion happened even if the booking is edited or paid later.
    const completedHistoryFilter = tenantFilter(req, {
      statusHistory: {
        $elemMatch: { status: "COMPLETED", changedAt: { $gte: from, $lt: to } },
      },
    });
    const noShowHistoryFilter = tenantFilter(req, {
      statusHistory: {
        $elemMatch: { status: "NO_SHOW", changedAt: { $gte: from, $lt: to } },
      },
    });

    const business = await Business.findById(tenantId(req))
      .select("businessTypeId")
      .lean();
    if (!business)
      return res.status(401).json({ message: "Unauthorized: Please login" });
    const businessType = await BusinessType.findById(business.businessTypeId)
      .select("resourceTypes")
      .lean();
    const personTypes = (businessType?.resourceTypes ?? [])
      .filter((type) => type.isPerson && type.isActive)
      .map((type) => type.code);

    // Independent count and aggregation queries run together because none needs another's result.
    const [
      bookingsCount,
      completedCount,
      noShowCount,
      earnedPaise,
      previousEarnedPaise,
      activeStaffCount,
      paymentTotals,
      topServices,
      topStaff,
    ] = await Promise.all([
      Booking.countDocuments(scheduledFilter),
      Booking.countDocuments(completedHistoryFilter),
      Booking.countDocuments(noShowHistoryFilter),
      countCompletedRevenue(req, from, to),
      countCompletedRevenue(req, previousFrom, previousTo),
      // A staff member is an enabled resource whose business-type configuration marks it as a person.
      Resource.countDocuments(
        tenantFilter(req, {
          isActive: true,
          resourceType: { $in: personTypes },
        }),
      ),
      Booking.aggregate([
        // Payment totals deliberately cover the same completed bookings as earned revenue.
        { $match: completedFilter },
        // Split the money into paid and unpaid buckets in one database query.
        {
          $group: {
            _id: "$paymentStatus",
            totalAmountPaise: { $sum: "$totalAmountPaise" },
          },
        },
      ]),
      getTopServicesByRevenue(req, from, to),
      getTopStaffByCompletedBookings(req, from, to, personTypes),
    ]);
    const paidTotal =
      paymentTotals.find((total) => total._id === "paid")?.totalAmountPaise ??
      0;
    const unpaidTotal =
      paymentTotals.find((total) => total._id === "unpaid")?.totalAmountPaise ??
      0;
    // Pending and future appointments are excluded so the no-show rate reflects resolved attendance only.
    const resolvedBookings = completedCount + noShowCount;

    return res.status(200).json({
      summary: {
        period,
        range: { from, to },
        bookingsCount,
        revenue: {
          earnedPaise,
          previousEarnedPaise,
          collectedPaise: paidTotal,
          outstandingPaise: unpaidTotal,
        },
        noShows: {
          count: noShowCount,
          resolvedBookings,
          rate: resolvedBookings ? noShowCount / resolvedBookings : 0,
        },
        activeStaffCount,
        topServices,
        topStaff,
      },
    });
  } catch (error) {
    console.error("Failed to load dashboard summary:", error);
    return res
      .status(500)
      .json({ message: "Unable to load dashboard summary" });
  }
};

export { getDashboardSummary };
