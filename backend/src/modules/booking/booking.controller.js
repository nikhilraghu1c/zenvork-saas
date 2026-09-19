import mongoose from "mongoose";
import Booking from "./booking.model.js";
import Client from "../client/client.model.js";
import Resource from "../resource/resource.model.js";
import Service from "../service/service.model.js";
import { tenantData, tenantFilter } from "../../utils/tenant-scope.js";
import {
  BookingValidationError,
  validateBookingCreation,
  validateBookingListQuery,
  validateBookingPaymentStatusUpdate,
  validateBookingStatusUpdate,
  validateBookingUpdate,
} from "./booking.validation.js";

const ALLOWED_STATUS_TRANSITIONS = {
  PENDING: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  SCHEDULED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};
const EDITABLE_BOOKING_STATUSES = ["PENDING", "SCHEDULED", "CHECKED_IN"];

const getServiceSnapshots = async (req, serviceIds) => {
  if (serviceIds.length === 0) return [];

  // Booking line items can only be created from active services in the authenticated tenant.
  const services = await Service.find(
    tenantFilter(req, { _id: { $in: serviceIds }, isActive: true }),
  )
    .select("name pricePaise durationMinutes")
    .lean();
  if (services.length !== serviceIds.length) return null;

  const servicesById = new Map(
    services.map((service) => [service._id.toString(), service]),
  );
  return serviceIds.map((serviceId) => {
    const service = servicesById.get(serviceId);
    return {
      serviceId: service._id,
      name: service.name,
      pricePaise: service.pricePaise,
      durationMinutes: service.durationMinutes,
    };
  });
};

const getTotalAmountPaise = (services, extraAmountPaise = 0) =>
  services.reduce((total, service) => total + service.pricePaise, extraAmountPaise);

const toPublicBooking = (booking, includeServices = false) => {
  const source = typeof booking.toObject === "function" ? booking.toObject() : booking;
  const response = {
    _id: source._id,
    client: source.clientId,
    resources: source.resourceIds,
    scheduledStartAt: source.scheduledStartAt,
    scheduledEndAt: source.scheduledEndAt,
    actualStartAt: source.actualStartAt,
    actualEndAt: source.actualEndAt,
    status: source.status,
    extraAmountPaise: source.extraAmountPaise ?? 0,
    totalAmountPaise: source.totalAmountPaise ?? 0,
    paymentStatus: source.paymentStatus ?? "unpaid",
    notes: source.notes,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };

  if (includeServices) response.services = source.services ?? [];

  // Audit entries expose the lifecycle timeline without leaking staff or tenant identifiers.
  if (Object.hasOwn(source, "statusHistory")) {
    response.statusHistory = source.statusHistory.map(({ status, changedAt }) => ({
      status,
      changedAt,
    }));
  }

  return response;
};

const getAllBookings = async (req, res) => {
  try {
    const {
      filter: listFilter,
      sort,
      page,
      limit,
    } = validateBookingListQuery(req.query);
    const filter = tenantFilter(req, listFilter);

    // Return only bookings owned by the authenticated business.
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .select(
          "clientId resourceIds scheduledStartAt scheduledEndAt actualStartAt actualEndAt status extraAmountPaise totalAmountPaise paymentStatus notes createdAt updatedAt",
        )
        .populate("clientId", "name mobile")
        .populate("resourceIds", "name resourceType")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    // Keep database references and tenant/audit identifiers internal once records are returned.
    const bookingResponses = bookings.map(toPublicBooking);

    return res.status(200).json({
      bookings: bookingResponses,
      pagination: { page, limit, total },
    });
  } catch (error) {
    if (error instanceof BookingValidationError) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Failed to retrieve booking details:", error);
    return res
      .status(500)
      .json({ message: "Unable to retrieve booking details" });
  }
};

const getBookingById = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking" });
    }

    // Load one tenant-owned booking with the same public summaries used by the list endpoint.
    const booking = await Booking.findOne(tenantFilter(req, { _id: req.params.id }))
      .select(
        "clientId resourceIds scheduledStartAt scheduledEndAt actualStartAt actualEndAt services extraAmountPaise totalAmountPaise paymentStatus status statusHistory notes createdAt updatedAt",
      )
      .populate("clientId", "name mobile email")
      .populate("resourceIds", "name resourceType")
      .lean();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({ booking: toPublicBooking(booking, true) });
  } catch (error) {
    console.error("Failed to retrieve booking details:", error);
    return res.status(500).json({ message: "Unable to retrieve booking details" });
  } 
};

const updateBooking = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking" });
    }

    const updateData = validateBookingUpdate(req.body);
    // Tenant scope prevents changes to a booking owned by another business.
    const booking = await Booking.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (!EDITABLE_BOOKING_STATUSES.includes(booking.status)) {
      return res.status(409).json({ message: "This booking can no longer be edited" });
    }
    if (
      booking.status === "CHECKED_IN" &&
      (updateData.hasClientId || updateData.hasResourceIds || updateData.hasSchedule)
    ) {
      return res.status(409).json({ message: "Only notes and services can be updated after check-in" });
    }
    if (
      booking.status === "PENDING" &&
      updateData.hasResourceIds &&
      updateData.resourceIds.length > 0 &&
      !updateData.hasSchedule
    ) {
      return res.status(400).json({
        message: "Pending bookings can receive resources only when being scheduled",
      });
    }

    if (updateData.hasClientId) {
      // Reassigned clients must remain records owned by the authenticated business.
      const clientExists = await Client.exists(
        tenantFilter(req, { _id: updateData.clientId }),
      );
      if (!clientExists) {
        return res.status(400).json({ message: "Invalid client" });
      }
    }
    if (updateData.hasResourceIds && updateData.resourceIds.length > 0) {
      // Assigned resources must be active and belong to the booking's tenant.
      const resourceCount = await Resource.countDocuments(
        tenantFilter(req, {
          _id: { $in: updateData.resourceIds },
          isActive: true,
        }),
      );
      if (resourceCount !== updateData.resourceIds.length) {
        return res
          .status(400)
          .json({ message: "One or more resources are invalid or inactive" });
      }
    }
    let serviceSnapshots = null;
    if (updateData.hasServiceIds) {
      serviceSnapshots = await getServiceSnapshots(req, updateData.serviceIds);
      if (!serviceSnapshots) {
        return res.status(400).json({ message: "One or more services are invalid or inactive" });
      }
    }

    const scheduledStartAt = updateData.hasSchedule
      ? updateData.scheduledStartAt
      : booking.scheduledStartAt;
    const scheduledEndAt = updateData.hasSchedule
      ? updateData.scheduledEndAt
      : booking.scheduledEndAt;
    const resourceIds = updateData.hasResourceIds
      ? updateData.resourceIds
      : booking.resourceIds;
    const becomesScheduled = booking.status === "PENDING" && updateData.hasSchedule;
    if (
      (becomesScheduled || booking.status === "SCHEDULED") &&
      (updateData.hasSchedule || updateData.hasResourceIds) &&
      resourceIds.length > 0
    ) {
      // Exclude this booking so its existing slot does not conflict during a reschedule.
      const conflictingBooking = await Booking.exists(
        tenantFilter(req, {
          _id: { $ne: booking._id },
          resourceIds: { $in: resourceIds },
          status: { $in: ["SCHEDULED", "CHECKED_IN"] },
          scheduledStartAt: { $lt: scheduledEndAt },
          scheduledEndAt: { $gt: scheduledStartAt },
        }),
      );
      if (conflictingBooking) {
        return res.status(409).json({
          message: "One or more selected resources are unavailable at this time",
        });
      }
    }

    if (updateData.hasClientId) booking.clientId = updateData.clientId;
    if (updateData.hasResourceIds) booking.resourceIds = updateData.resourceIds;
    if (updateData.hasSchedule) {
      booking.scheduledStartAt = updateData.scheduledStartAt;
      booking.scheduledEndAt = updateData.scheduledEndAt;
    }
    if (updateData.hasNotes) booking.notes = updateData.notes;
    if (serviceSnapshots) {
      booking.services = serviceSnapshots;
    }
    if (updateData.hasExtraAmountPaise) {
      booking.extraAmountPaise = updateData.extraAmountPaise;
    }
    if (serviceSnapshots || updateData.hasExtraAmountPaise) {
      booking.totalAmountPaise = getTotalAmountPaise(
        booking.services,
        booking.extraAmountPaise,
      );
    }
    if (becomesScheduled) {
      // Scheduling a pending booking is the only non-lifecycle endpoint status change.
      const changedAt = new Date();
      booking.status = "SCHEDULED";
      booking.statusHistory.push({
        status: "SCHEDULED",
        changedAt,
        changedBy: req.user._id,
      });
    }
    await booking.save();

    await booking.populate("clientId", "name mobile email");
    await booking.populate("resourceIds", "name resourceType");
    return res.status(200).json({
      message: "Booking updated successfully",
      booking: toPublicBooking(booking, true),
    });
  } catch (error) {
    if (error instanceof BookingValidationError) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Failed to update booking:", error);
    return res.status(500).json({ message: "Unable to update booking" });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking" });
    }

    const statusUpdate = validateBookingStatusUpdate(req.body);
    const { status: nextStatus, resourceIds } = statusUpdate;
    // Tenant scope prevents staff from transitioning a booking owned by another business.
    const booking = await Booking.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!ALLOWED_STATUS_TRANSITIONS[booking.status].includes(nextStatus)) {
      return res.status(409).json({
        message: `Cannot change ${booking.status} booking to ${nextStatus}`,
      });
    }

    if (nextStatus === "CHECKED_IN") {
      // Check-in assigns only active resources from the authenticated business.
      const resourceCount = await Resource.countDocuments(
        tenantFilter(req, {
          _id: { $in: resourceIds },
          isActive: true,
        }),
      );
      if (resourceCount !== resourceIds.length) {
        return res
          .status(400)
          .json({ message: "One or more resources are invalid or inactive" });
      }

      // A resource cannot begin two services simultaneously, including unscheduled walk-ins.
      const activeResourceBooking = await Booking.exists(
        tenantFilter(req, {
          _id: { $ne: booking._id },
          resourceIds: { $in: resourceIds },
          status: "CHECKED_IN",
        }),
      );
      if (activeResourceBooking) {
        return res.status(409).json({
          message: "One or more selected resources are currently serving another booking",
        });
      }

      if (booking.scheduledStartAt && booking.scheduledEndAt) {
        // A scheduled check-in must also preserve the resource's planned-slot availability.
        const scheduledConflict = await Booking.exists(
          tenantFilter(req, {
            _id: { $ne: booking._id },
            resourceIds: { $in: resourceIds },
            status: { $in: ["SCHEDULED", "CHECKED_IN"] },
            scheduledStartAt: { $lt: booking.scheduledEndAt },
            scheduledEndAt: { $gt: booking.scheduledStartAt },
          }),
        );
        if (scheduledConflict) {
          return res.status(409).json({
            message: "One or more selected resources are unavailable at this time",
          });
        }
      }

      booking.resourceIds = resourceIds;
    }

    const changedAt = new Date();
    // Actual service timestamps are always assigned by the server in UTC.
    if (nextStatus === "CHECKED_IN") booking.actualStartAt = changedAt;
    if (nextStatus === "COMPLETED") booking.actualEndAt = changedAt;

    booking.status = nextStatus;
    booking.statusHistory.push({
      status: nextStatus,
      changedAt,
      changedBy: req.user._id,
    });
    await booking.save();

    await booking.populate("clientId", "name mobile email");
    await booking.populate("resourceIds", "name resourceType");
    return res.status(200).json({
      message: "Booking status updated successfully",
      booking: toPublicBooking(booking, true),
    });
  } catch (error) {
    if (error instanceof BookingValidationError) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Failed to update booking status:", error);
    return res.status(500).json({ message: "Unable to update booking status" });
  }
};

const createBooking = async (req, res) => {
  try {
    const bookingData = validateBookingCreation(req.body);
    const {
      client: newClientData,
      clientId: existingClientId,
      serviceIds,
      extraAmountPaise,
      ...bookingFields
    } = bookingData;
    let createdBooking;

    if (existingClientId) {
      // A booking cannot reference a client from another tenant.
      const clientExists = await Client.exists(
        tenantFilter(req, { _id: existingClientId }),
      );
      if (!clientExists) {
        return res.status(400).json({ message: "Invalid client" });
      }
    }

    if (bookingFields.resourceIds.length > 0) {
      // Every assigned resource must be active and owned by this business.
      const resourceCount = await Resource.countDocuments(
        tenantFilter(req, {
          _id: { $in: bookingFields.resourceIds },
          isActive: true,
        }),
      );
      if (resourceCount !== bookingFields.resourceIds.length) {
        return res
          .status(400)
          .json({ message: "One or more resources are invalid or inactive" });
      }
    }

    const serviceSnapshots = await getServiceSnapshots(req, serviceIds);
    if (!serviceSnapshots) {
      return res.status(400).json({ message: "One or more services are invalid or inactive" });
    }
    const bookingServiceFields = {
      ...bookingFields,
      services: serviceSnapshots,
      extraAmountPaise,
      totalAmountPaise: getTotalAmountPaise(serviceSnapshots, extraAmountPaise),
    };

    if (
      bookingFields.status === "SCHEDULED" &&
      bookingFields.resourceIds.length > 0
    ) {
      // Intersecting time ranges indicate an unavailable assigned resource.
      const conflictingBooking = await Booking.exists(
        tenantFilter(req, {
          resourceIds: { $in: bookingFields.resourceIds },
          status: { $in: ["SCHEDULED", "CHECKED_IN"] },
          scheduledStartAt: { $lt: bookingFields.scheduledEndAt },
          scheduledEndAt: { $gt: bookingFields.scheduledStartAt },
        }),
      );
      if (conflictingBooking) {
        return res
          .status(409)
          .json({
            message:
              "One or more selected resources are unavailable at this time",
          });
      }
    }

    if (newClientData) {
      // A new client and its booking must either both persist or both roll back.
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const client = new Client(tenantData(req, newClientData));
          await client.save({ session });

          [createdBooking] = await Booking.create(
            [
              tenantData(req, {
                ...bookingServiceFields,
                clientId: client._id,
                createdBy: req.user._id,
              }),
            ],
            { session },
          );
        });
      } finally {
        await session.endSession();
      }
    } else {
      // Tenant identity and creator are always derived from the authenticated user.
      createdBooking = await Booking.create(
        tenantData(req, {
          ...bookingServiceFields,
          clientId: existingClientId,
          createdBy: req.user._id,
        }),
      );
    }

    return res.status(201).json({
      message: "Booking created successfully",
      bookingId: createdBooking._id,
    });
  } catch (error) {
    if (error instanceof BookingValidationError) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Failed to create booking:", error);
    return res.status(500).json({ message: "Unable to create booking" });
  }
};

const updateBookingPaymentStatus = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking" });
    }
    const { paymentStatus } = validateBookingPaymentStatusUpdate(req.body);
    // Payment state is only meaningful for a completed, tenant-owned booking.
    const booking = await Booking.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "COMPLETED") {
      return res.status(409).json({ message: "Only completed bookings can be marked paid or unpaid" });
    }
    booking.paymentStatus = paymentStatus;
    await booking.save();
    await booking.populate("clientId", "name mobile email");
    await booking.populate("resourceIds", "name resourceType");
    return res.status(200).json({
      message: "Payment status updated successfully",
      booking: toPublicBooking(booking, true),
    });
  } catch (error) {
    if (error instanceof BookingValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Failed to update payment status:", error);
    return res.status(500).json({ message: "Unable to update payment status" });
  }
};

export {
  getAllBookings,
  getBookingById,
  updateBooking,
  updateBookingPaymentStatus,
  updateBookingStatus,
  createBooking,
};
