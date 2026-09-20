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
actual times, status, `hasServices`, `extraAmountPaise`, `totalAmountPaise`, `paymentStatus`, notes, timestamps, a populated `client`
(`name`, `mobile`), and populated `resources` (`name`, `resourceType`) summaries. Database reference
names `clientId` and `resourceIds` are not returned in list responses. Line-item services are returned
only by the detail endpoint.

Optional query parameters are `from` and `to` (ISO date-times with a timezone), comma-separated
`status`, `resourceId`, `clientId`, `assignment=assigned|unassigned`, `page`, `limit` (maximum 100),
`sortBy=scheduledStartAt|createdAt|updatedAt`, and `order=asc|desc`. The default is chronological
scheduled time ascending; a `status=PENDING` queue defaults to oldest created first.

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
`scheduledEndAt`, and `notes` are accepted. Client, resource, and schedule edits are allowed only
while a booking is `PENDING` or `SCHEDULED`; services and the extra amount may be changed while it
is `PENDING`, `SCHEDULED`, or `CHECKED_IN`.
Terminal bookings cannot be edited.

Send scheduled start and end together; they must be ISO date-times with a timezone and form a valid
range. The server verifies tenant-owned active resources and checks conflicts, excluding the booking
being rescheduled. Supplying a time range for a `PENDING` booking automatically changes it to
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

Owners and staff can set a completed booking to `paid` or `unpaid`. This records only the manual
settlement state: it does not create an invoice, process a payment, calculate tax, or change booking
services and totals. A non-completed booking returns `409`.

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
