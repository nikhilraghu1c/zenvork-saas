import { Router } from "express";
import { createBooking, getAllBookings } from "./booking.controller.js";

const bookingRouter = Router();

// Owners and staff can create and view bookings for their authenticated business.
bookingRouter.get("/", getAllBookings);
bookingRouter.post("/", createBooking);

export default bookingRouter;
