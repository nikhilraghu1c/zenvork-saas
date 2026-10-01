# Express request flow

This guide follows a protected Zenvork request from the browser to MongoDB and back.

## The request path

For this request:

```http
GET /api/bookings?status=SCHEDULED&page=1
```

the execution path is:

```text
app.js
  → routes/index.routes.js
    → userAuth middleware
      → modules/booking/booking.routes.js
        → getAllBookings controller
          → Booking.find(...) / Booking.countDocuments(...)
            → JSON response
```

## 1. Express mounts the API router

`backend/src/app.js` mounts the main API router at `/api`. This lets every module route use a short
path such as `/bookings`, while its public URL is `/api/bookings`.

```js
app.use('/api', apiRouter);
```

`app.use()` registers middleware or a router. Express tries registered handlers in order.

## 2. The main router applies authentication

In `backend/src/routes/index.routes.js`:

```js
apiRouter.use('/bookings', userAuth, bookingRouter);
```

means that requests beginning `/api/bookings` must first run `userAuth`. If authentication succeeds,
Express continues into `bookingRouter`; otherwise the request ends with `401`.

## 3. Middleware adds trusted request information

`userAuth` reads the signed cookie or bearer token, verifies it, loads the user, and attaches it to
the request:

```js
req.user = user;
next();
```

`next()` means “continue to the next matching middleware or route.” Controllers can now trust
`req.user.businessId`; they must never accept a tenant ID from browser input.

## 4. A module router chooses a controller

In `backend/src/modules/booking/booking.routes.js`:

```js
bookingRouter.get('/', getAllBookings);
```

matches `GET /api/bookings` and calls `getAllBookings(req, res)`.

## 5. The controller coordinates the work

A controller normally follows this order:

```text
validate input
→ construct tenant-scoped query
→ enforce business rules
→ query or update MongoDB
→ return a safe response
→ catch expected/unexpected errors
```

Simplified list-controller structure:

```js
const getAllBookings = async (req, res) => {
  try {
    const { filter, page, limit } = validateBookingListQuery(req.query);
    const tenantScopedFilter = tenantFilter(req, filter);

    const bookings = await Booking.find(tenantScopedFilter).limit(limit).lean();
    return res.status(200).json({ bookings });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to retrieve bookings' });
  }
};
```

`async` allows the controller to wait for database work with `await` without blocking other Node.js
requests. It does not make the code synchronous; it pauses only this function until MongoDB replies.

## 6. Validation is different from business rules

Validation answers: “Is this request shaped correctly?”

```text
Is page a positive integer?
Is status an allowed string?
Is the supplied ID valid?
```

Business rules answer: “Is this valid in the current business state?”

```text
Is the booking in this tenant?
Can this status change happen now?
Is the assigned resource available?
```

Zenvork keeps input parsing in `*.validation.js` files and state/database rules in controllers.

## 7. Return only public data

Mongoose documents contain internal fields such as `businessId`, `createdBy`, and database references.
Booking controllers transform results through `toPublicBooking()` before returning them. This prevents
the API from accidentally exposing tenant or audit identifiers.

## Practice exercise

Trace `PATCH /api/bookings/:id/payment-status` through these files:

```text
booking.routes.js
→ auth.middleware.js
→ booking.validation.js
→ booking.controller.js
→ booking.model.js
```

Identify where the request shape is checked, where the completed-status rule is checked, and where
`paidAt` is set.
