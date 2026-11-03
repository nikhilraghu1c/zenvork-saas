import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import {
  BookingValidationError,
  validateBookingCreation,
  validateBookingListQuery,
  validateBookingPaymentStatusUpdate,
  validateBookingStatusUpdate,
  validateBookingUpdate,
} from "../src/modules/booking/booking.validation.js";

const objectId = () => {
  return new mongoose.Types.ObjectId().toString();
};

const futureDateTime = (minutesFromNow) => {
  return new Date(Date.now() + minutesFromNow * 60_000).toISOString();
};

const assertValidationError = (callback, message) => {
  assert.throws(callback, (error) => {
    assert.ok(error instanceof BookingValidationError);
    assert.equal(error.message, message);
    return true;
  });
};

test("booking creation accepts a future scheduled slot and snapshots quantity and discount input", () => {
  const clientId = objectId();
  const serviceId = objectId();
  const resourceId = objectId();
  const scheduledStartAt = futureDateTime(60);
  const scheduledEndAt = futureDateTime(120);

  const booking = validateBookingCreation({
    clientId,
    resourceIds: [resourceId],
    serviceItems: [{ serviceId, quantity: 3 }],
    discount: { type: "percentage", percentageBasisPoints: 1_500 },
    extraAmountPaise: 250,
    scheduledStartAt,
    scheduledEndAt,
    notes: "  Bridal party booking  ",
  });

  assert.equal(booking.clientId, clientId);
  assert.deepEqual(booking.resourceIds, [resourceId]);
  assert.deepEqual(booking.serviceItems, [{ serviceId, quantity: 3 }]);
  assert.deepEqual(booking.discount, {
    type: "percentage",
    percentageBasisPoints: 1_500,
  });
  assert.equal(booking.extraAmountPaise, 250);
  assert.equal(booking.status, "SCHEDULED");
  assert.equal(booking.notes, "Bridal party booking");
  assert.ok(booking.scheduledStartAt instanceof Date);
  assert.ok(booking.scheduledEndAt instanceof Date);
});

test("booking creation creates a pending walk-in when no schedule is supplied", () => {
  const booking = validateBookingCreation({ clientId: objectId() });

  assert.equal(booking.status, "PENDING");
  assert.equal(booking.scheduledStartAt, null);
  assert.equal(booking.scheduledEndAt, null);
  assert.deepEqual(booking.serviceItems, []);
});

test("booking creation rejects server-controlled fields and ambiguous client ownership", () => {
  assertValidationError(
    () => {
      validateBookingCreation({ clientId: objectId(), status: "COMPLETED" });
    },
    "Invalid request data",
  );

  assertValidationError(
    () => {
      validateBookingCreation({
        clientId: objectId(),
        client: { name: "Nisha Shah", mobile: "9876543210" },
      });
    },
    "Provide either an existing client or new client details",
  );
});

test("booking creation rejects invalid quantities, duplicate services, and a past schedule", () => {
  const serviceId = objectId();

  assertValidationError(
    () => {
      validateBookingCreation({
        clientId: objectId(),
        serviceItems: [{ serviceId, quantity: 0 }],
      });
    },
    "Each service needs a valid ID and quantity of at least one",
  );

  assertValidationError(
    () => {
      validateBookingCreation({
        clientId: objectId(),
        serviceItems: [
          { serviceId, quantity: 1 },
          { serviceId, quantity: 2 },
        ],
      });
    },
    "A service can be selected only once",
  );

  assertValidationError(
    () => {
      validateBookingCreation({
        clientId: objectId(),
        scheduledStartAt: futureDateTime(-120),
        scheduledEndAt: futureDateTime(-60),
      });
    },
    "Scheduled start time cannot be in the past",
  );
});

test("check-in requires one or more distinct resources, while other transitions cannot assign them", () => {
  const resourceId = objectId();

  assertValidationError(
    () => {
      validateBookingStatusUpdate({ status: "CHECKED_IN" });
    },
    "Assign at least one resource before checking in",
  );

  assertValidationError(
    () => {
      validateBookingStatusUpdate({ status: "COMPLETED", resourceIds: [resourceId] });
    },
    "Resources can only be assigned while checking in",
  );

  assert.deepEqual(
    validateBookingStatusUpdate({ status: "CHECKED_IN", resourceIds: [resourceId] }),
    { status: "CHECKED_IN", resourceIds: [resourceId] },
  );
});

test("booking updates can modify a future range together but cannot modify lifecycle fields", () => {
  const scheduledStartAt = futureDateTime(60);
  const scheduledEndAt = futureDateTime(120);

  const update = validateBookingUpdate({
    scheduledStartAt,
    scheduledEndAt,
    notes: "  Client requested a window seat  ",
  });

  assert.equal(update.hasSchedule, true);
  assert.equal(update.notes, "Client requested a window seat");

  assertValidationError(
    () => {
      validateBookingUpdate({ status: "COMPLETED" });
    },
    "Invalid booking update fields",
  );

  assertValidationError(
    () => {
      validateBookingUpdate({ scheduledStartAt });
    },
    "Scheduled start and end times must both be provided",
  );
});

test("list validation builds an overlap filter and blocks conflicting resource filters", () => {
  const from = futureDateTime(60);
  const to = futureDateTime(120);
  const resourceId = objectId();

  const result = validateBookingListQuery({
    from,
    to,
    dateField: "scheduled",
    resourceId,
    status: "SCHEDULED,CHECKED_IN",
    page: "2",
    limit: "25",
  });

  assert.equal(result.filter.resourceIds, resourceId);
  assert.deepEqual(result.filter.status, { $in: ["SCHEDULED", "CHECKED_IN"] });
  assert.deepEqual(result.filter.scheduledStartAt, { $lt: new Date(to) });
  assert.deepEqual(result.filter.scheduledEndAt, { $gt: new Date(from) });
  assert.equal(result.page, 2);
  assert.equal(result.limit, 25);

  assertValidationError(
    () => {
      validateBookingListQuery({ assignment: "unassigned", resourceId });
    },
    "An unassigned booking cannot have a resource filter",
  );
});

test("payment status validation accepts only a single supported value", () => {
  assert.deepEqual(validateBookingPaymentStatusUpdate({ paymentStatus: "paid" }), {
    paymentStatus: "paid",
  });

  assertValidationError(
    () => {
      validateBookingPaymentStatusUpdate({ paymentStatus: "refunded" });
    },
    "Invalid payment status update",
  );
});
