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
actual times, status, notes, timestamps, a populated `client` (`name`, `mobile`), and populated
`resources` (`name`, `resourceType`) summaries. Database reference names `clientId` and `resourceIds`
are not returned in list responses.

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
`email`) and populated `resources` (`name`, `resourceType`). Returns `404` when the booking is not
in the authenticated business.

## Edit a booking

```http
PATCH /api/bookings/:id
```

```json
{
  "resourceIds": ["65f123456789012345678902"],
  "scheduledStartAt": "2026-09-16T04:30:00.000Z",
  "scheduledEndAt": "2026-09-16T05:00:00.000Z",
  "notes": "Prefers a senior stylist"
}
```

Only `clientId`, `resourceIds`, `scheduledStartAt`, `scheduledEndAt`, and `notes` are accepted.
Client, resource, and schedule edits are allowed only while a booking is `PENDING` or `SCHEDULED`;
a `CHECKED_IN` booking may update only `notes`. Terminal bookings cannot be edited.

Send scheduled start and end together; they must be ISO date-times with a timezone and form a valid
range. The server verifies tenant-owned active resources and checks conflicts, excluding the booking
being rescheduled. Supplying a time range for a `PENDING` booking automatically changes it to
`SCHEDULED` and adds a status-history entry. A pending booking cannot receive resources until it is
being scheduled. This endpoint does not accept `status`, actual timestamps, tenant fields, or audit
fields.

## Update booking status

```http
PATCH /api/bookings/:id/status
```

```json
{
  "status": "CHECKED_IN"
}
```

Only the `status` field is accepted. The server records UTC lifecycle times and the authenticated
staff member in `statusHistory`; clients cannot provide `actualStartAt`, `actualEndAt`, `changedBy`,
or tenant fields.

Allowed transitions are:

- `PENDING` → `CHECKED_IN`, `CANCELLED`, or `NO_SHOW`
- `SCHEDULED` → `CHECKED_IN`, `CANCELLED`, or `NO_SHOW`
- `CHECKED_IN` → `COMPLETED`

`CHECKED_IN` sets `actualStartAt` and `COMPLETED` sets `actualEndAt`. `COMPLETED`, `CANCELLED`, and
`NO_SHOW` are terminal states. Invalid transitions return `409`.

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
overlapping `SCHEDULED` or `CHECKED_IN` booking.

The request cannot provide status, actual times, `businessId`, or `createdBy`. Actual service times
are set by the status-update endpoint.

Successful creation returns `{ "message": "Booking created successfully", "bookingId": "..." }`.
