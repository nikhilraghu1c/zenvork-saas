# Email OTP Verification while creating businesses

# Expose business types for registration

Add an endpoint that returns the enabled business types. The frontend should use this response
instead of maintaining Salon and Clinic options locally, keeping business-type support data-driven.

# Add authenticated session recovery

Add a credentialed endpoint such as `GET /api/me` that validates the HttpOnly access-token cookie
and returns safe current-user data. The frontend will use it to restore authentication after a page
reload or in a newly opened browser tab without exposing the JWT to JavaScript.

# Booking token and queue system (deferred)

Build the core Booking create/list flow before adding queue functionality.

## General queue

- Scope tokens to a business and IST date when no resource is known at booking time.
- Allocate tokens with Redis `INCR` using `token:{businessId}:{date}` and an expiry of about 48 hours.
- Create the booking with `resourceIds: []` and `status: PENDING`.
- Add `PATCH /bookings/:id/assign` to assign resources after staff decides who serves the client.

## Resource-specific queue

- Scope tokens to a business, primary person resource, and IST date when a client requests a specific
  stylist, doctor, or mechanic.
- Allocate tokens with Redis `INCR` using `token:{businessId}:{primaryResourceId}:{date}`.
- Create the booking with its requested `resourceIds`.
- Add `primaryResourceId` to Booking when this work begins. It must reference one of `resourceIds` and
  belong to the booking's business.

## Supporting work

- Add `tokenNumber: Number` to Booking.
- Track the currently served token for each business/resource in Redis when staff selects “Call next”.
- Broadcast the currently served number through WebSockets to a business-scoped room.
- Add an unauthenticated, read-only “now serving” page for in-shop displays.
- Do not expose a token number as client authentication; use mobile OTP for future client tracking.

# Booking end-of-day cleanup (deferred)

Add configurable end-of-day handling for bookings that remain unresolved. This must be a per-business
choice, not a global automatic rule.

- Add `Business.endOfDayCleanup`: `"auto_no_show" | "none"`, surfaced later in the Settings page.
- When configured as `"auto_no_show"`, use a BullMQ nightly job that respects `business.timezone` to
  mark unchecked-in `PENDING` and `SCHEDULED` bookings as `NO_SHOW` at day end.
- When configured as `"none"`, leave unresolved `PENDING` and `SCHEDULED` bookings unchanged.
- Never auto-resolve `CHECKED_IN` bookings that are not `COMPLETED`; always flag them as
  `needsReview` for staff to close manually.
- Build a bulk-review experience for `needsReview` bookings alongside the scheduled cleanup work.

# Booking list improvements (deferred)

- Add tenant-scoped booking status summary counts for clickable Needs assignment, Checked in, Completed,
  and No-show cards.
- Default the list to an Active view (`PENDING`, `SCHEDULED`, `CHECKED_IN`) and add backend-supported
  client name/mobile search.
- Add Today, Tomorrow, and This week date shortcuts; keep pending work as a visible queue rather than
  hiding unresolved bookings behind a schedule-date filter.
- Add the gradient treatment for the single New booking primary CTA.
