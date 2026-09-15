# Bookings API

All booking endpoints require the HttpOnly authentication cookie established by login. Owners and
staff can access only bookings for their authenticated business. The backend derives `businessId` and
`createdBy`; clients must not send either field.

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
will be set by future check-in and completion endpoints.

Successful creation returns `{ "message": "Booking created successfully", "bookingId": "..." }`.
