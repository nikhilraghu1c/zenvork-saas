import Booking from "../booking/booking.model.js";
import Business from "../business/business.model.js";
import BusinessType from "../business/business-type.model.js";
import Resource from "../resource/resource.model.js";
import { tenantFilter, tenantId } from "../../utils/tenant-scope.js";
import { REPORTING_PERIODS, getReportingRange } from "../../utils/reporting-period.js";

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

// Counts the current booking state using the lifecycle timestamp that makes that state meaningful.
const getBookingHealth = async (req, from, to) => {
  const dateRange = { $gte: from, $lt: to };
  const statusChangedWithinRange = (status) => ({
    status,
    statusHistory: { $elemMatch: { status, changedAt: dateRange } },
  });

  const [pending, scheduled, checkedIn, completed, cancelled, noShow] =
    await Promise.all([
      // Pending work is dated by when the request was made because it has no appointment slot.
      Booking.countDocuments(tenantFilter(req, { status: "PENDING", createdAt: dateRange })),
      // Planned work stays tied to its booked slot until staff check the client in.
      Booking.countDocuments(
        tenantFilter(req, { status: "SCHEDULED", scheduledStartAt: dateRange }),
      ),
      // An in-progress service belongs to the period in which staff started it.
      Booking.countDocuments(
        tenantFilter(req, { status: "CHECKED_IN", actualStartAt: dateRange }),
      ),
      // Completed work is dated by its server-recorded finish time.
      Booking.countDocuments(
        tenantFilter(req, { status: "COMPLETED", actualEndAt: dateRange }),
      ),
      // Terminal outcomes use immutable status-history timestamps rather than later record edits.
      Booking.countDocuments(tenantFilter(req, statusChangedWithinRange("CANCELLED"))),
      Booking.countDocuments(tenantFilter(req, statusChangedWithinRange("NO_SHOW"))),
    ]);

  return { pending, scheduled, checkedIn, completed, cancelled, noShow };
};

const getDashboardSummary = async (req, res) => {
  try {
    const period = req.query.period ?? "today";
    // Reject arrays or other malformed query values instead of treating them as the default period.
    if (typeof period !== "string" || !REPORTING_PERIODS.includes(period)) {
      return res
        .status(400)
        .json({ message: "Period must be today, week, or month" });
    }

    const { from, to, previousFrom, previousTo } = getReportingRange(period);
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
      bookingHealth,
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
      getBookingHealth(req, from, to),
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
        bookingHealth,
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
