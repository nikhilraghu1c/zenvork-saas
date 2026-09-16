import { Router } from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  updateBookingStatus,
} from "./booking.controller.js";

const bookingRouter = Router();

// Owners and staff can create and view bookings for their authenticated business.
bookingRouter.get("/", getAllBookings);
bookingRouter.get("/:id", getBookingById);
bookingRouter.post("/", createBooking);
bookingRouter.patch("/:id", updateBooking);
bookingRouter.patch("/:id/status", updateBookingStatus);

export default bookingRouter;
