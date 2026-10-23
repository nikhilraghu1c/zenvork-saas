import { Router } from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingCalendarSummary,
  updateBooking,
  updateBookingPaymentStatus,
  updateBookingStatus,
} from "./booking.controller.js";

const bookingRouter = Router();

// Owners and staff can create and view bookings for their authenticated business.
bookingRouter.get("/", getAllBookings);
bookingRouter.get("/calendar-summary", getBookingCalendarSummary);
bookingRouter.get("/:id", getBookingById);
bookingRouter.post("/", createBooking);
bookingRouter.patch("/:id", updateBooking);
bookingRouter.patch("/:id/status", updateBookingStatus);
bookingRouter.patch("/:id/payment-status", updateBookingPaymentStatus);

export default bookingRouter;
