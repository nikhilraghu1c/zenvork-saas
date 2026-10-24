# Booking queries and lifecycle

This guide explains the most important booking controller patterns in
`backend/src/modules/booking/booking.controller.js`.

## Routes and validation flow

```text
GET   /api/bookings                    list
GET   /api/bookings/calendar-summary   month counts
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
was created*, or *what occupies this date*.

The `dateField` query parameter maps a validated UI value to a stored MongoDB timestamp field:

```js
const dateFieldMap = {
  modified: 'updatedAt',
  created: 'createdAt',
};
filter[dateFieldMap[dateField]] = { $gte: from, $lt: to };

// A planned interval is present when it intersects the requested interval.
filter.scheduledStartAt = { $lt: to };
filter.scheduledEndAt = { $gt: from };
```

Bracket notation (`filter[fieldName]`) uses the mapped field name as a key. The allow-list is
important: callers cannot choose an arbitrary database field. `modified` is the default, preserving
the existing All bookings activity behavior. `scheduled` is deliberately an interval-overlap filter,
not a planned-start filter: an appointment from 22 Oct 10 PM to 23 Oct 10 AM appears for both dates.
It naturally excludes unscheduled pending bookings because they have no schedule range.

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

## Summarise Month calendar bookings

**Requirement:** show a month overview without loading every booking record. The calendar summary
accepts a short scheduled-time range plus optional lifecycle-status and resource filters. It counts a
booking on every business-calendar date that its continuous schedule interval occupies.

```js
Booking.aggregate([
  { $match: {
    businessId,
    scheduledStartAt: { $lt: rangeEnd },
    scheduledEndAt: { $gt: rangeStart },
  } },
  // Clamp to the requested range, then expand the interval into visible business days.
  { $project: { visibleStart: { $max: ['$scheduledStartAt', rangeStart] }, visibleEnd: { $min: ['$scheduledEndAt', rangeEnd] } } },
  { $project: { startDay: { $dateTrunc: { date: '$visibleStart', unit: 'day', timezone: BUSINESS_TIME_ZONE } }, endDay: { $dateTrunc: { date: { $dateSubtract: { startDate: '$visibleEnd', unit: 'millisecond', amount: 1 } }, unit: 'day', timezone: BUSINESS_TIME_ZONE } } } },
  { $project: { startDay: 1, dayOffsets: { $range: [0, { $add: [{ $dateDiff: { startDate: '$startDay', endDate: '$endDay', unit: 'day', timezone: BUSINESS_TIME_ZONE } }, 1] }] } } },
  { $unwind: '$dayOffsets' },
  { $project: { date: { $dateToString: { date: { $dateAdd: { startDate: '$startDay', unit: 'day', amount: '$dayOffsets', timezone: BUSINESS_TIME_ZONE } }, format: '%Y-%m-%d', timezone: BUSINESS_TIME_ZONE } } } },
  { $group: { _id: '$date', total: { $sum: 1 } } },
  { $project: { _id: 0, date: '$_id', total: 1 } },
  { $sort: { date: 1 } },
]);
```

`$match` runs first, so MongoDB works only with the selected tenant's overlapping scheduled bookings.
The strict `<` and `>` boundaries treat the end as exclusive: a booking ending exactly at midnight does
not count for the following day. `$max` and `$min` clamp a crossing booking to the visible range.
`$dateTrunc`, `$dateDiff`, `$range`, and `$dateAdd` create one date key per business day occupied by
each matching booking. `$sum: 1` then counts calendar presence, so a booking from 22 Oct 10 PM to
23 Oct 10 AM contributes one count to both 22 Oct and 23 Oct. `$project` exposes only `{ date, total }`,
and `$sort` returns days in calendar order. A user taps a count to enter Day view, where the normal
scheduled-overlap list query returns the actual booking records.

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
  .select('name pricePaise durationMinutes requiresPersonResource')
  .lean();
```

`$in` accepts any service ID in the request array. The controller compares `services.length` with
`serviceIds.length`; a mismatch means at least one ID is invalid, inactive, or belongs to another tenant.
It then copies name, price, duration, and the person requirement into the Booking document as immutable
line-item snapshots. At check-in and completion, a booking with any snapshot requiring staff must
have an assigned resource whose configured type is a person type.

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

## Calculate quantity and discount totals from snapshots

**Requirement:** group bookings must charge each selected service by its quantity, while a saved
discount must remain explainable and historically accurate.

A request sends line items such as `{ serviceId, quantity }`. The controller validates the service in
the current tenant, then copies its name, price, duration, staffing rule, and quantity into the
booking. It does not trust a price from the browser. The subtotal is calculated from those snapshots:

```js
const getServiceSubtotalPaise = (services) => {
  return services.reduce((total, service) => {
    return total + service.pricePaise * (service.quantity ?? 1);
  }, 0);
};
```

`reduce()` visits every line item and carries `total` into the next iteration. `quantity ?? 1` means
historic bookings created before this feature still bill each line once when they are read or edited.

The final calculation is:

```text
service subtotal = Σ(pricePaise × quantity)
total = service subtotal − resolved discount + extraAmountPaise
```

The model keeps three discount fields for different jobs:

| Field | Purpose |
|---|---|
| `discountType` | Says whether the saved rule was `none`, a fixed `amount`, or `percentage`. |
| `discountValue` | Retains the original rule input: paise for an amount or basis points for a percentage (`10,000 = 100%`). |
| `discountAmountPaise` | Stores the resolved rupee discount actually applied to this booking. |

For example, a ₹2,000 subtotal with a 10% discount retains `discountType: 'percentage'`,
`discountValue: 1000`, and `discountAmountPaise: 20000`. Keeping both the original rule and the
resolved amount lets the edit UI recreate the percentage while receipts, reporting, and historic totals
can show the exact deduction. The controller rejects a discount greater than the service subtotal.

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

## Keep appointment reminders aligned with booking lifecycle

**Requirement:** a manual reminder must follow the current planned slot but must not make the booking
look newly modified in the All bookings activity feed.

After a scheduled creation, first scheduling, or reschedule, the controller calls
`upsertPendingAppointmentReminder()`. It updates the one `PENDING` Reminder document for the booking
with the new `scheduledStartAt` snapshot, `dueAt`, and `expiresAt`; if no pending document exists, it
creates one. Sent and skipped records are never rewritten, so rescheduling after an outcome preserves
that history and starts a new pending reminder for the revised slot. On check-in it calls
`closeAppointmentReminderQueue()`: an earlier `actualStartAt` shortens pending and sent reminders'
queue expiry, while pending work is also cancelled. Sent records remain available in the Sent today log
when they were confirmed on the current business day. Completion, cancellation, and no-show call
`cancelPendingAppointmentReminders()`.

Those helper queries update the separate Reminder collection, not the Booking document. Therefore
Mongoose updates Reminder timestamps only; Booking `updatedAt` remains the actual staff booking edit
time. This preserves the meaning of the All bookings Modified-on filter.
