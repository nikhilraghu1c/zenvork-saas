import mongoose from "mongoose";
import Booking from "./booking.model.js";
import Client from "../client/client.model.js";
import Resource from "../resource/resource.model.js";
import { tenantData, tenantFilter } from "../../utils/tenant-scope.js";
import {
  BookingValidationError,
  validateBookingCreation,
  validateBookingListQuery,
} from "./booking.validation.js";

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

    // Keep database reference names internal once populated records are returned to the client.
    const bookingResponses = bookings.map(({ clientId, resourceIds, ...booking }) => ({
      ...booking,
      client: clientId,
      resources: resourceIds,
    }));

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
        "clientId resourceIds scheduledStartAt scheduledEndAt actualStartAt actualEndAt status notes createdAt updatedAt",
      )
      .populate("clientId", "name mobile email")
      .populate("resourceIds", "name resourceType")
      .lean();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const { clientId, resourceIds, ...bookingFields } = booking;
    return res.status(200).json({
      booking: { ...bookingFields, client: clientId, resources: resourceIds },
    });
  } catch (error) {
    console.error("Failed to retrieve booking details:", error);
    return res.status(500).json({ message: "Unable to retrieve booking details" });
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

          await Booking.create(
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
      await Booking.create(
        tenantData(req, {
          ...bookingFields,
          clientId: existingClientId,
          createdBy: req.user._id,
        }),
      );
    }

    return res.status(201).json({ message: "Booking created successfully" });
  } catch (error) {
    if (error instanceof BookingValidationError) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Failed to create booking:", error);
    return res.status(500).json({ message: "Unable to create booking" });
  }
};

export { getAllBookings, getBookingById, createBooking };
