# Booking queries and lifecycle

This guide explains the most important booking controller patterns in
`backend/src/modules/booking/booking.controller.js`.

## Routes and validation flow

```text
GET   /api/bookings                    list
GET   /api/bookings/:id                detail
POST  /api/bookings                    create
PATCH /api/bookings/:id                edit allowed fields
PATCH /api/bookings/:id/status         lifecycle transition
PATCH /api/bookings/:id/payment-status settlement state
```

The parent API router authenticates every route. `booking.validation.js` first validates request shape;
the controller then checks database-backed rules such as tenant ownership, resource availability, and
allowed status transitions. The Mongoose model is the final integrity layer for paired schedule dates
and lifecycle-required actual timestamps.

## Read one booking safely

**Requirement:** load a booking detail only when its ID belongs to the authenticated business.

To load one booking by ID, Zenvork uses:

```js
const booking = await Booking.findOne(
  tenantFilter(req, { _id: req.params.id }),
);
```

Equivalent MongoDB meaning:

```js
{
  _id: requestedBookingId,
  businessId: authenticatedUsersBusinessId
}
```

`findOne()` returns one matching document or `null`. It is safer than `findById()` for tenant-owned
data because the tenant criterion is always present.

## Query operators used in Zenvork

| Operator | Meaning | Example |
|---|---|---|
| `$in` | field equals any item in an array | `status: { $in: ['SCHEDULED', 'CHECKED_IN'] }` |
| `$ne` | field is not equal to a value | `_id: { $ne: booking._id }` |
| `$lt` | less than | `scheduledStartAt: { $lt: requestedEnd }` |
| `$gt` | greater than | `scheduledEndAt: { $gt: requestedStart }` |
| `$gte` | greater than or equal to | `updatedAt: { $gte: from }` |
| `$lte` | less than or equal to | useful for inclusive comparisons; Zenvork normally uses `$lt` for range ends |

The `$` prefix means that this is a MongoDB operator rather than an ordinary document field.

## Prevent resource double-booking

**Requirement:** reject a create/reschedule request when any selected resource already has an active
booking that intersects the requested time range.

When rescheduling a booking, Zenvork asks MongoDB whether a conflicting booking exists:

```js
const conflictingBooking = await Booking.exists(
  tenantFilter(req, {
    _id: { $ne: booking._id },
    resourceIds: { $in: resourceIds },
    status: { $in: ['SCHEDULED', 'CHECKED_IN'] },
    scheduledStartAt: { $lt: scheduledEndAt },
    scheduledEndAt: { $gt: scheduledStartAt },
  }),
);
```

`exists()` is used because the controller only needs a yes/no answer. It avoids loading a full booking
document when one is not required.

Creation uses the same query without `_id: { $ne: booking._id }`, because no current booking exists to
exclude yet.

### Why the overlap test works

Two ranges overlap when:

```text
existing start < requested end
AND
existing end > requested start
```

Example conflict:

```text
Existing:  10:00 ───────── 11:00
Requested:       10:30 ───────── 11:30
```

```text
10:00 < 11:30  true
11:00 > 10:30  true
```

Both are true, so the resource is unavailable.

Exact back-to-back bookings are allowed:

```text
Existing:  10:00 ───────── 11:00
Requested:                    11:00 ───────── 12:00
```

`11:00 > 11:00` is false, so there is no overlap. This is why the query uses strict `$lt` and `$gt`
instead of `$lte` and `$gte`.

## List bookings with pagination

**Requirement:** return a stable slice of matching bookings and the total matching count for desktop
pagination or mobile infinite scroll.

### Combine several lifecycle statuses

**Requirement:** allow staff to view several work queues together, such as pending and scheduled,
without making separate requests or losing a resource/date constraint.

The list API accepts `status=PENDING,SCHEDULED`. Validation splits that allow-listed string into the
local `statusValues` array, then builds this portion of the MongoDB filter:

```js
filter.status = { $in: ['PENDING', 'SCHEDULED'] };
```

`$in` means **OR within one field**: a booking may be pending *or* scheduled. It is not a replacement
for the rest of `filter`; MongoDB combines sibling fields with **AND**. For example:

```js
{
  businessId: tenantBusinessId,
  status: { $in: ['PENDING', 'SCHEDULED'] },
  resourceIds: selectedResourceId,
  updatedAt: { $gte: from, $lt: to }
}
```

means: tenant-owned bookings with either selected status **and** that resource **and** a modified time
inside the chosen range. `status` is the only lifecycle list parameter; a single selected status is
sent as one value, such as `status=SCHEDULED`.

### Choose the All bookings date field

**Requirement:** staff may ask different questions of the same calendar date: *what changed*, *what
was created*, or *what is scheduled*.

The `dateField` query parameter maps a validated UI value to a stored MongoDB timestamp field:

```js
const dateFieldMap = {
  modified: 'updatedAt',
  created: 'createdAt',
  scheduled: 'scheduledStartAt',
};
filter[dateFieldMap[dateField]] = { $gte: from, $lt: to };
```

Bracket notation (`filter[fieldName]`) uses the mapped field name as a key. The allow-list is
important: callers cannot choose an arbitrary database field. `modified` is the default, preserving
the existing All bookings activity behavior. A scheduled-date filter naturally excludes unscheduled
pending bookings because they have no `scheduledStartAt` value.

The list controller runs two independent queries in parallel:

```js
const [bookings, total] = await Promise.all([
  Booking.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean(),
  Booking.countDocuments(filter),
]);
```

- `find(filter)` selects matching bookings.
- `sort(sort)` makes page order predictable.
- `skip()` ignores earlier rows.
- `limit()` selects this page's maximum rows.
- `countDocuments()` gives the frontend the total for pagination.
- `Promise.all()` starts both database operations together and waits for both.
- `lean()` returns plain JavaScript objects instead of heavier Mongoose documents. Use it for read-only
  data; do not use it when you need to modify the loaded document and call `.save()`.

The All bookings view sorts by `{ updatedAt: -1, _id: -1 }`. `-1` means descending/newest first;
`_id` is a stable tie-breaker when two rows have the same timestamp.

## Populate references

Bookings store only IDs for the client and resources. The list needs names, so Mongoose performs
reference lookups:

```js
.populate('clientId', 'name mobile')
.populate('resourceIds', 'name resourceType')
```

The second argument is a field allow-list. This is important: a list only needs a client name/mobile,
not every client field.

## Other important booking queries

### Resolve active service snapshots

**Requirement:** allow only currently active services from the tenant and copy their historical values
into a booking.

```js
const services = await Service.find(
  tenantFilter(req, { _id: { $in: serviceIds }, isActive: true }),
)
  .select('name pricePaise durationMinutes')
  .lean();
```

`$in` accepts any service ID in the request array. The controller compares `services.length` with
`serviceIds.length`; a mismatch means at least one ID is invalid, inactive, or belongs to another tenant.
It then copies name, price, and duration into the Booking document as immutable line-item snapshots.

### Search bookings through matching clients

**Requirement:** search bookings by client name/mobile even though booking documents store only
`clientId`.

Bookings store `clientId`, while the search text targets client name/mobile. The list controller first
finds matching clients in the same tenant:

```js
const matchingClients = await Client.find(tenantFilter(req, {
  $or: [
    { name: { $regex: escapedSearch, $options: 'i' } },
    { mobile: { $regex: escapedSearch } },
  ],
}))
  .select('_id')
  .limit(100)
  .lean();
```

It then adds the resulting IDs to the Booking filter as `clientId: { $in: matchingClientIds }`. Escaping
the search text prevents the user from supplying special regular-expression syntax; `i` makes name
matching case-insensitive.

### Validate resource IDs by count

**Requirement:** reject a request if any selected resource is inactive, nonexistent, or outside this
business.

```js
const resourceCount = await Resource.countDocuments(
  tenantFilter(req, { _id: { $in: resourceIds }, isActive: true }),
);
```

If `resourceCount !== resourceIds.length`, at least one requested resource does not exist, is inactive,
or belongs to another tenant. This protects create, edit, and check-in flows.

### Payment-status lookup

**Requirement:** change payment state only for one completed booking owned by the current tenant.

```js
const booking = await Booking.findOne(tenantFilter(req, { _id: req.params.id }));
```

The controller verifies that the booking exists and is `COMPLETED` before changing payment state. A real
unpaid-to-paid transition sets `paidAt`; repeated paid requests retain the original payment timestamp.

### Check-in conflict queries

**Requirement:** prevent a resource from being checked into two simultaneous services and preserve a
scheduled booking's time-slot availability.

Check-in validates that each assigned resource is active in the tenant, then checks that it is not
already checked in elsewhere:

```js
Booking.exists(tenantFilter(req, {
  _id: { $ne: booking._id },
  status: 'CHECKED_IN',
  resourceIds: { $in: resourceIds },
}));
```

For a previously scheduled booking, the controller also checks an overlapping scheduled slot for the
assigned resources. This prevents a resource from starting a walk-in or another appointment while it
is already reserved for an intersecting time range.

## Booking lifecycle is a state machine

The controller permits only these transitions:

```text
PENDING   → CHECKED_IN | CANCELLED | NO_SHOW
SCHEDULED → CHECKED_IN | CANCELLED | NO_SHOW
CHECKED_IN → COMPLETED
```

Terminal states cannot move again:

```text
COMPLETED, CANCELLED, NO_SHOW
```

The `ALLOWED_STATUS_TRANSITIONS` object is a simple state machine. Before changing status, the
controller verifies that `nextStatus` is in the array for the booking's current status. On check-in and
completion, the server sets actual timestamps itself; the browser is not allowed to forge those times.
