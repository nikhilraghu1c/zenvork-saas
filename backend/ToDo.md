# Email OTP Verification while creating businesses

# Expose business types for registration

Add an endpoint that returns the enabled business types. The frontend should use this response
instead of maintaining Salon and Clinic options locally, keeping business-type support data-driven.

# Add authenticated session recovery

Add a credentialed endpoint such as `GET /api/me` that validates the HttpOnly access-token cookie
and returns safe current-user data. The frontend will use it to restore authentication after a page
reload or in a newly opened browser tab without exposing the JWT to JavaScript.

# Atomic checked-in resource protection (deferred)

The current check-in flow verifies that a selected resource is not already `CHECKED_IN` before it
updates the booking. Harden this against concurrent requests so two check-ins cannot both observe the
resource as free and then both succeed.

- Use a database-enforced reservation or another atomic MongoDB strategy for active resource use.
- Scope every reservation and lookup to `businessId`.
- Make a competing check-in return `409 Conflict` without changing the losing booking.
- Release the active reservation when the booking becomes `COMPLETED`, `CANCELLED`, or `NO_SHOW`.
- Keep planned-slot conflict checks separate from this active check-in protection.

# Booking calendar follow-ups (deferred)

## Staff default resource filter

- When an authenticated staff user has an active resource whose `linkedUserId` matches their user ID,
  default the Calendar resource filter to that resource.
- Keep owners on **All resources** by default, and use **All resources** as a fallback for staff who
  have no linked active resource.
- Preserve an intentional staff choice of **All resources** across refresh/navigation, rather than
  restoring the staff default on every load.
- Treat this as a display preference only; server-side booking access rules remain authoritative.

## Quick booking detail view

- Replace direct navigation on a Day/Week event click with a small read-only preview dialog.
- Show client, scheduled time, assigned resources, and lifecycle status, with a **View booking** action
  that navigates to the full detail page.
- Keep Month count clicks as a shortcut to Day view, not as booking-detail dialogs.

# Hindi language support (planned)

Add an app-wide English/Hindi language preference using translation keys for static UI text.

- Keep tenant-entered data such as client names, services, notes, and business names unchanged.
- Persist the chosen language for the signed-in user or device.
- Introduce translations incrementally by feature, without mixing untranslated hard-coded strings into new UI.

# Booking discounts (planned)

Add a first-class booking discount rather than relying on a negative manual adjustment.

- Support a validated discount amount or percentage with an explicit stored type.
- Snapshot the resolved discount amount on the booking for payment, analytics, and historical accuracy.
- Present subtotal, discount, extra charge, and final total clearly in booking create, edit, and details views.
- Do not permit a discount larger than the service subtotal.

# Group bookings with service quantities (planned)

Allow one booking to bill a selected service for multiple people without introducing attendee records yet.

- Add `quantity` to each booking service snapshot; default it to `1`.
- Calculate each line as `pricePaise × quantity`, then calculate the booking total from line totals.
- Add quantity controls in booking create and edit flows, and show quantities in booking details and reporting.
- Keep duration and resource capacity manually managed for version one; do not automatically multiply duration by quantity.
- Keep multi-day and multi-session scheduling as a separate future feature.

# Continuous multi-day bookings (planned)

Allow one booking to run continuously across midnight or multiple calendar dates, such as 22 Oct
10 PM through 23 Oct 10 AM.

- Keep the existing `scheduledStartAt` and `scheduledEndAt` model; it already represents a continuous
  cross-date range.
- Update booking create and edit UI to allow choosing an end date separately from the start date.
- Preserve resource conflict checks across the full continuous time range.
- Render one event spanning the relevant dates in future Day, Week, and Month calendar views.
- Change calendar Day/Week retrieval from a start-date filter to an overlap filter:
  `scheduledStartAt < rangeEnd && scheduledEndAt > rangeStart`. This ensures an overnight booking
  remains visible on every date it occupies.
- Change the Month summary aggregation so it counts a continuous booking on every business-calendar
  date it overlaps, rather than grouping only by `scheduledStartAt`. Define this as calendar presence
  counts, not a summed unique-booking total across the month.
- Treat multiple non-contiguous sessions as a separate future feature with a different data model.

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
- Add Tomorrow and This week date shortcuts to the all-bookings history view.
- Add the gradient treatment for the single New booking primary CTA.
