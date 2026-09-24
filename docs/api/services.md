# Services API

All service endpoints require the HttpOnly authentication cookie established by login. The backend
derives the tenant identity from the authenticated user; clients must not send `businessId`.

Service prices are integers in paise, preventing fractional-currency rounding errors. A service can
be deactivated but is never deleted through this API, so bookings can safely retain its historical
snapshot.

## List services

```http
GET /api/services?active=true
```

Owners and staff can list only their business's services. Omit `active` to return both active and
inactive services; use `active=true` or `active=false` to filter. The response is
`{ "services": [...] }`, where each service contains `_id`, `name`, `pricePaise`,
`description`, `durationMinutes`, `isActive`, `createdAt`, and `updatedAt`.
When both statuses are requested, active services appear first, followed by name and ID order.

## Service options

```http
GET /api/services/options
```

Owners and staff can retrieve the active services suitable for a booking selector. The response is
`{ "services": [{ "_id": "...", "name": "Haircut", "pricePaise": 50000,
"durationMinutes": 45 }] }`, ordered by name and ID.

## Get a service

```http
GET /api/services/:id
```

Returns `{ "service": {...} }` for a service owned by the authenticated business, including
`description`, or `404` when the service is not in that business.

## Create a service

```http
POST /api/services
```

Only an `OWNER` can create a service.

```json
{
  "name": "Haircut",
  "description": "Wash, cut, and finish.",
  "pricePaise": 50000,
  "durationMinutes": 45,
  "isActive": true
}
```

`name` is required and limited to 100 characters. `pricePaise` must be a non-negative whole number;
`description` is optional plain text up to 500 characters. `durationMinutes` must be a whole number
from 1 to 1440. `isActive` is optional and defaults to `true`. Service names are unique within a
business.
Successful creation returns HTTP `201` with the created public service.

## Update a service

```http
PATCH /api/services/:id
```

Only an `OWNER` can update one or more of `name`, `description`, `pricePaise`, `durationMinutes`,
and `isActive`.
Use `{ "isActive": false }` to retire a service. The endpoint returns the updated public service;
it does not change any service snapshots already stored on bookings.
