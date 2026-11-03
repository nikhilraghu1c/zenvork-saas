import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import Booking from "../src/modules/booking/booking.model.js";

const objectId = () => {
  return new mongoose.Types.ObjectId();
};

const createBooking = (overrides = {}) => {
  return new Booking({
    businessId: objectId(),
    clientId: objectId(),
    createdBy: objectId(),
    ...overrides,
  });
};

test("new pending walk-ins are valid and receive an initial status history entry", async () => {
  const booking = createBooking();

  await booking.validate();

  assert.equal(booking.status, "PENDING");
  assert.equal(booking.statusHistory.length, 1);
  assert.equal(booking.statusHistory[0].status, "PENDING");
  assert.equal(booking.statusHistory[0].changedBy.toString(), booking.createdBy.toString());
});

test("scheduled bookings require a complete, forward-moving interval", async () => {
  const start = new Date(Date.now() + 60 * 60_000);
  const end = new Date(Date.now() + 90 * 60_000);
  const validBooking = createBooking({
    status: "SCHEDULED",
    scheduledStartAt: start,
    scheduledEndAt: end,
  });

  await validBooking.validate();

  const invalidBooking = createBooking({ status: "SCHEDULED" });
  await assert.rejects(invalidBooking.validate(), /Scheduled bookings require start and end times/);
});

test("checked-in and completed bookings require their server-recorded actual timestamps", async () => {
  const checkedInBooking = createBooking({ status: "CHECKED_IN" });
  await assert.rejects(checkedInBooking.validate(), /Checked-in bookings require an actual start time/);

  const completedBooking = createBooking({
    status: "COMPLETED",
    actualStartAt: new Date(),
  });
  await assert.rejects(completedBooking.validate(), /Completed bookings require actual start and end times/);
});
