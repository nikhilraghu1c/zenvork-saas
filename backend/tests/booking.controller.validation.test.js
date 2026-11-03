import assert from "node:assert/strict";
import test from "node:test";
import {
  createBooking,
  getAllBookings,
  getBookingCalendarSummary,
  updateBookingPaymentStatus,
  updateBookingStatus,
} from "../src/modules/booking/booking.controller.js";

const createResponse = () => {
  const response = {
    body: undefined,
    statusCode: undefined,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return response;
};

test("create booking rejects a client-provided lifecycle status before database work", async () => {
  const response = createResponse();

  await createBooking(
    { body: { clientId: "507f1f77bcf86cd799439011", status: "COMPLETED" } },
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { message: "Invalid request data" });
});

test("booking list rejects unsupported query fields before tenant queries", async () => {
  const response = createResponse();

  await getAllBookings({ query: { businessId: "507f1f77bcf86cd799439011" } }, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { message: "Invalid query parameters" });
});

test("calendar summary requires a valid bounded range", async () => {
  const response = createResponse();

  await getBookingCalendarSummary({ query: { from: "not-a-date" } }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.message, "Calendar summary requires a complete date range");
});

test("status updates reject check-in requests without a resource assignment", async () => {
  const response = createResponse();

  await updateBookingStatus(
    { params: { id: "507f1f77bcf86cd799439011" }, body: { status: "CHECKED_IN" } },
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    message: "Assign at least one resource before checking in",
  });
});

test("payment updates reject unsupported statuses before loading the booking", async () => {
  const response = createResponse();

  await updateBookingPaymentStatus(
    { params: { id: "507f1f77bcf86cd799439011" }, body: { paymentStatus: "refunded" } },
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { message: "Invalid payment status update" });
});
