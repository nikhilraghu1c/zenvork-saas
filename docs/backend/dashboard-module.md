# Dashboard module learning guide

**Code:** `backend/src/modules/dashboard/`.

## Responsibility

`GET /api/dashboard/summary` returns a tenant-scoped operational summary for `today`, `week`, or
`month`. It combines counts and aggregations without loading all bookings into Node.js.

## Route, validation, and lifecycle

The parent API router applies `userAuth`; the dashboard accepts an authenticated owner or staff member.
Only `today`, `week`, and `month` are valid periods. An unknown value or an array returns `400` rather
than silently choosing a date range.

Dashboard is a read model, not a stored document:

```text
Booking/Resource/Business data changes → next request recalculates dashboard response
```

There is no dashboard collection or cache to update today.

## Parallel independent queries

The controller uses `Promise.all()` for independent queries:

```js
const [bookingsCount, earnedPaise, topServices] = await Promise.all([
  Booking.countDocuments(scheduledFilter),
  countCompletedRevenue(req, from, to),
  getTopServicesByRevenue(req, from, to),
]);
```

Each query starts immediately. The controller waits once for all results, reducing request time compared
with waiting for each one sequentially.

## Important MongoDB queries

### Completed revenue total

**Requirement:** calculate revenue earned from work completed by this business inside the selected
business-timezone period.

```js
Booking.aggregate([
  { $match: tenantFilter(req, {
    status: 'COMPLETED',
    actualEndAt: { $gte: from, $lt: to },
  }) },
  { $group: { _id: null, totalAmountPaise: { $sum: '$totalAmountPaise' } } },
]);
```

`$match` keeps completed bookings in the business-date range. `$group` with `_id: null` creates one
tenant total. `tenantFilter()` injects the authenticated business condition into `$match`. `$sum` adds
booking totals without loading all records into Node.js. If no bookings match, the aggregation array is
empty and the helper returns zero.

### Booking health counts

**Requirement:** count how many bookings entered each meaningful lifecycle state in the selected period.

```js
Booking.countDocuments(tenantFilter(req, {
  status: 'SCHEDULED',
  scheduledStartAt: { $gte: from, $lt: to },
}));
```

`countDocuments()` is faster and clearer than loading bookings only to read `.length`. Each status uses
the timestamp meaningful to that state; cancelled/no-show use `$elemMatch` against `statusHistory`.

### Paid and unpaid split in one query

**Requirement:** split the amount of completed work in the period into its currently paid and unpaid
booking totals.

```js
Booking.aggregate([
  { $match: completedFilter },
  { $group: {
    _id: '$paymentStatus',
    totalAmountPaise: { $sum: '$totalAmountPaise' },
  } },
]);
```

The result has up to two groups: `{ _id: 'paid', ... }` and `{ _id: 'unpaid', ... }`. The controller
finds each group in the small aggregation result and uses zero when a group does not exist.

### Top services query

**Requirement:** rank the three services contributing the most completed-booking revenue.

```js
Booking.aggregate([
  { $match: completedFilter },
  { $unwind: '$services' },
  { $group: {
    _id: '$services.serviceId',
    name: { $first: '$services.name' },
    revenuePaise: { $sum: '$services.pricePaise' },
    bookingsCount: { $sum: 1 },
  } },
  { $sort: { revenuePaise: -1, name: 1 } },
  { $limit: 3 },
]);
```

`$unwind` turns a booking with several service snapshots into separate pipeline rows. MongoDB can then
sum each service's snapshot price and rank the top three without being affected by later catalogue edits.

### Top staff query

**Requirement:** rank only person resources by completed bookings, excluding chairs, rooms, and
equipment that happen to be assigned to the same booking.

The controller first loads active person resources, then queries completed bookings that contain one of
their IDs. After `$unwind: '$resourceIds'`, a second `$match` removes assigned chairs/rooms before
grouping:

```js
{ $match: { resourceIds: { $in: staffIds } } }
{ $group: { _id: '$resourceIds', bookingsCount: { $sum: 1 } } }
```

This is a two-step filter because a booking can reserve both a person and a non-person resource.

## Different metrics use meaningful dates

The dashboard does not use one date field for every status:

```text
Pending     → createdAt
Scheduled   → scheduledStartAt
Checked-in  → actualStartAt
Completed   → actualEndAt
Cancelled   → matching statusHistory.changedAt
No-show     → matching statusHistory.changedAt
```

This preserves the business meaning of each metric and avoids later edits/payment changes moving a
historical status into another period.

## Aggregation patterns

- `countCompletedRevenue()` uses `$match` then `$group`/`$sum` for earned revenue.
- `getTopServicesByRevenue()` uses `$unwind: '$services'`, then groups snapshots by service ID.
- `getTopStaffByCompletedBookings()` first identifies person resources, then excludes rooms/equipment
  from ranking after unwinding assigned resources.

The reporting range comes from `utils/reporting-period.js`, which creates date bounds in the configured
business timezone before querying UTC MongoDB dates.
