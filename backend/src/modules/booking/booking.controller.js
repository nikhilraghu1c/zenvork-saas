import mongoose from "mongoose";
import Booking from "./booking.model.js";
import Client from "../client/client.model.js";
import Resource from "../resource/resource.model.js";
import { tenantData, tenantFilter } from "../../utils/tenant-scope.js";
import {
  BookingValidationError,
  validateBookingCreation,
  validateBookingListQuery,
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

const toPublicBooking = (booking) => {
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
    notes: source.notes,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };

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
          "clientId resourceIds scheduledStartAt scheduledEndAt actualStartAt actualEndAt status notes createdAt updatedAt",
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
        "clientId resourceIds scheduledStartAt scheduledEndAt actualStartAt actualEndAt status statusHistory notes createdAt updatedAt",
      )
      .populate("clientId", "name mobile email")
      .populate("resourceIds", "name resourceType")
      .lean();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({ booking: toPublicBooking(booking) });
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
      return res.status(409).json({ message: "Only notes can be updated after check-in" });
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
      booking: toPublicBooking(booking),
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

    const nextStatus = validateBookingStatusUpdate(req.body);
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
      booking: toPublicBooking(booking),
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
                ...bookingFields,
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
          ...bookingFields,
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

export {
  getAllBookings,
  getBookingById,
  updateBooking,
  updateBookingStatus,
  createBooking,
};
