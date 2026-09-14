import { Router } from "express";
import { createBooking, getAllBookings, getBookingById } from "./booking.controller.js";

const bookingRouter = Router();

// Owners and staff can create and view bookings for their authenticated business.
bookingRouter.get("/", getAllBookings);
bookingRouter.get("/:id", getBookingById);
bookingRouter.post("/", createBooking);

export default bookingRouter;
