# Bookings API

All booking endpoints require the HttpOnly authentication cookie established by login. Owners and
staff can access only bookings for their authenticated business. The backend derives `businessId` and
`createdBy`; clients must not send either field.

Booking responses use populated `client` and `resources` summaries. They do not expose `businessId`,
`createdBy`, Mongoose version fields, or the staff identifiers retained in internal status history.

## List bookings

```http
GET /api/bookings
```

Returns `{ bookings: [...], pagination: { page, limit, total } }`. Each booking includes its schedule,
actual times, status, `hasServices`, `extraAmountPaise`, `totalAmountPaise`, `paymentStatus`,
`paidAt`, notes, timestamps, a populated `client`
(`name`, `mobile`), and populated `resources` (`name`, `resourceType`) summaries. Database reference
names `clientId` and `resourceIds` are not returned in list responses. Line-item services are returned
only by the detail endpoint.

Optional query parameters are `view=today|all`, `status` (one or more comma-separated lifecycle
values), `from` and `to` (ISO date-times with a timezone), `search`, `resourceId`, `clientId`,
`assignment=assigned|unassigned`, `dateField=modified|created|scheduled`, `page`, and `limit`
(maximum 100). Multiple `status` values are alternatives (for example, `status=PENDING,SCHEDULED`)
and still combine with date, resource, assignment, and search filters.
`search` is a tenant-scoped, case-insensitive client-name or mobile-number search and must contain
2–100 characters.

`view=all` is the default and returns history ordered by `updatedAt` newest first. When a date range is
provided for that view, it applies to `updatedAt` by default; set `dateField=created` to filter by
booking creation or `dateField=scheduled` to filter by planned start. `view=today` requires a complete business-day
`from`/`to` range. It includes pending bookings created in that range, scheduled bookings whose planned
start is in the range, checked-in bookings whose actual start is in the range, completed bookings whose
actual end is in the range, and cancelled/no-show bookings updated in the range. Both views use
`updatedAt` newest first with `_id` as a final tie-breaker, so a status change keeps a today booking
visible and moves it to the top rather than making it disappear.

### Modified-on migration safety

`updatedAt` powers both the All bookings **Modified on** filter and its newest-activity ordering. Any
one-off system migration that updates existing bookings must use Mongoose `{ timestamps: false }`, so
it does not make historical bookings look newly modified. If a migration has already overwritten
`updatedAt`, the exact prior edit time cannot be recovered unless it was separately audited; the best
fallback is the latest lifecycle timestamp in `statusHistory`, actual start/end, or creation time.

## Get a booking

```http
GET /api/bookings/:id
```

Returns `{ booking: {...} }` for a booking owned by the authenticated business. The response includes
the same public booking fields as the list endpoint, with a populated `client` (`name`, `mobile`,
`email`) and populated `resources` (`name`, `resourceType`). It also includes `services`, whose items
contain `serviceId`, `name`, `pricePaise`, and `durationMinutes` snapshots, plus `extraAmountPaise`
and the server-calculated `totalAmountPaise`. Returns `404` when the booking is not in the authenticated business.

## Edit a booking

```http
PATCH /api/bookings/:id
```

```json
{
  "resourceIds": ["65f123456789012345678902"],
  "serviceIds": ["65f123456789012345678903"],
  "extraAmountPaise": 30000,
  "scheduledStartAt": "2026-09-16T04:30:00.000Z",
  "scheduledEndAt": "2026-09-16T05:00:00.000Z",
  "notes": "Prefers a senior stylist"
}
```

Only `clientId`, `resourceIds`, `serviceIds`, `extraAmountPaise`, `scheduledStartAt`,
`scheduledEndAt`, and `notes` are accepted. Client correction is allowed only while a booking is
`PENDING`; after scheduling, the client is locked. Resource and schedule edits are allowed only
while a booking is `PENDING` or `SCHEDULED`; services and the extra amount may be changed while it
is `PENDING`, `SCHEDULED`, or `CHECKED_IN`.
Terminal bookings cannot be edited.

Send scheduled start and end together; they must be ISO date-times with a timezone and form a valid
range, with a start time that is not in the past. The server verifies tenant-owned active resources
and checks conflicts, excluding the booking being rescheduled. Supplying a time range for a `PENDING` booking automatically changes it to
`SCHEDULED` and adds a status-history entry. A pending booking cannot receive resources until it is
being scheduled. `serviceIds` replaces the selected service list. Every ID must be an active service
owned by the authenticated business; the backend snapshots each service's name, price, and duration.
`extraAmountPaise` is optional and defaults to zero; it is a non-negative manual adjustment that the
backend adds to the snapshot service total. Create an `Other` service through the owner-only service
catalog API when staff need a selectable service with a business-configured default price. This
endpoint does not accept `status`, actual timestamps, tenant fields, totals, payment status, or audit
fields.

## Update booking status

```http
PATCH /api/bookings/:id/status
```

```json
{
  "status": "CHECKED_IN",
  "resourceIds": ["65f123456789012345678902"]
}
```

For `CHECKED_IN`, `resourceIds` is required and replaces the booking's assignment as part of the
same operation. The resources must be active, tenant-owned, and available; a resource already
`CHECKED_IN` on another booking cannot be selected. `COMPLETED`, `CANCELLED`, and `NO_SHOW` accept
only the `status` field. The server records UTC lifecycle times and the authenticated staff member
in `statusHistory`; clients cannot provide `actualStartAt`, `actualEndAt`, `changedBy`, or tenant
fields.

Allowed transitions are:

- `PENDING` → `CHECKED_IN`, `CANCELLED`, or `NO_SHOW`
- `SCHEDULED` → `CHECKED_IN`, `CANCELLED`, or `NO_SHOW`
- `CHECKED_IN` → `COMPLETED`

`CHECKED_IN` assigns selected resources and sets `actualStartAt`; `COMPLETED` sets `actualEndAt`.
`COMPLETED`, `CANCELLED`, and `NO_SHOW` are terminal states. Invalid transitions or unavailable
resources return `409`. A booking must contain at least one service before it can be completed;
create a zero-price service when a completed appointment has no charge.

## Update payment status

```http
PATCH /api/bookings/:id/payment-status
```

```json
{ "paymentStatus": "paid" }
```

Owners and staff can set a completed booking to `paid` or `unpaid`. Moving from unpaid to paid records
the server time in `paidAt`; returning to unpaid clears it. This records only the manual settlement
state: it does not create an invoice, process a payment, calculate tax, or change booking services and
totals. A non-completed booking returns `409`.

## Create a booking

```http
POST /api/bookings
```

```json
{
  "client": {
    "name": "Asha Patel",
    "mobile": "9876543210",
    "email": "asha@example.com"
  },
  "resourceIds": ["65f123456789012345678902"],
  "serviceIds": ["65f123456789012345678903"],
  "extraAmountPaise": 30000,
  "scheduledStartAt": "2026-09-13T04:30:00.000Z",
  "scheduledEndAt": "2026-09-13T05:00:00.000Z",
  "notes": "First consultation"
}
```

Provide exactly one client choice: an existing `clientId`, or a new `client` object with `name`,
10-digit Indian `mobile`, optional `email`, and optional `notes`. A new client and its booking are
created in one transaction. `resourceIds` is optional, allowing an unassigned booking. Scheduled
start and end must either both be absent (creating a `PENDING` booking) or both be ISO date-times
with a timezone (creating a `SCHEDULED` booking). The server validates that the client and resources
belong to the tenant and that resources are active. It returns `409` when a selected resource has an
overlapping `SCHEDULED` or `CHECKED_IN` booking. `serviceIds` is optional for both pending and
scheduled bookings. Each selected service must be active and tenant-owned; the server stores a
historical service snapshot and calculates `totalAmountPaise` from its snapshot prices plus the
optional `extraAmountPaise`.

The request cannot provide status, actual times, `businessId`, or `createdBy`. Actual service times
are set by the status-update endpoint.

Successful creation returns `{ "message": "Booking created successfully", "bookingId": "..." }`.

### Appointment reminders

Creating a scheduled booking creates one pending manual appointment reminder. First scheduling through
`PATCH /api/bookings/:id` does the same; rescheduling cancels the old pending reminder and creates a
new one for the revised start time. Check-in, completion, cancellation, and no-show cancel pending
reminders. An early check-in also closes a sent reminder's queue visibility at the real
`actualStartAt`; a reminder confirmed on that business day remains visible in the separate **Sent
today** log. These automatic Reminder writes never modify the booking's `updatedAt`, so they do not
affect the All bookings Modified-on filter or ordering. See
[Reminders API](reminders.md) for the staff queue and manual sent/skip actions.
