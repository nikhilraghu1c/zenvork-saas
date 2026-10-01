# MongoDB aggregation for analytics

`backend/src/modules/analytics/analytics.controller.js` uses MongoDB aggregation when the result is a
calculation rather than a list of bookings. Aggregation lets MongoDB calculate totals without sending
every booking to Node.js.

## Pipeline idea

An aggregation is an array of stages. Each stage receives the output of the previous stage:

```js
Booking.aggregate([
  { $match: filter },
  { $group: { ... } },
  { $sort: { _id: 1 } },
  { $project: { _id: 0, date: '$_id', amountPaise: 1 } },
]);
```

Read this as:

```text
select bookings → group/calculate → order groups → shape the response
```

## Aggregation operator reference

| Operator | Why Zenvork uses it | Example result/meaning |
|---|---|---|
| `$match` | Filter documents before doing calculations. It should be early so MongoDB processes only relevant tenant records. | Keep this business's completed bookings in a date range. |
| `$group` | Combine matching documents into summary buckets. | One bucket per day, service, payment state, or one overall total. |
| `$sum` | Add monetary values, or count documents with `$sum: 1`. | `₹200 + ₹650 = ₹850`; `1 + 1 = 2 bookings`. |
| `$unwind` | Turn each item in an array into its own pipeline row before grouping. | A booking with Haircut + Spa Service contributes to both service totals. |
| `$sort` | Give summaries a deterministic business order. | Daily rows oldest to newest; top services highest revenue first. |
| `$project` | Choose/rename only the fields returned to Node.js. | Replace internal group `_id` with public `date`. |
| `$limit` | Return only the requested top results after sorting. | Top 3 services or staff. |
| `$dateToString` | Convert a stored UTC instant into a business-calendar key. | Group `2026-10-01T18:45Z` under the correct India calendar day. |
| `$first` | Keep a representative field from each group when it is the same across that group's rows. | Keep the snapshot service name while grouping all rows for its service ID. |

The order matters. For example, `$sort` before `$limit` means “find the top three”; `$limit` before
`$sort` would only sort an arbitrary first three results.

## Same pipeline with a small example

```js
Booking.aggregate([
  { $match: { businessId, status: 'COMPLETED' } },
  { $unwind: '$services' },
  { $group: {
    _id: '$services.name',
    revenuePaise: { $sum: '$services.pricePaise' },
    bookingsCount: { $sum: 1 },
  } },
  { $sort: { revenuePaise: -1 } },
  { $limit: 3 },
  { $project: { _id: 0, serviceName: '$_id', revenuePaise: 1, bookingsCount: 1 } },
]);
```

This reads as:

```text
1. $match   → only this tenant's completed bookings
2. $unwind  → one row per service within a booking
3. $group   → one bucket per service name
4. $sum     → add service prices and count service line items
5. $sort    → highest revenue first
6. $limit   → keep the top three
7. $project → return clean response field names
```

## Summary totals: `$sum`

`getAmountSummary()` uses:

```js
{
  $group: {
    _id: null,
    amountPaise: { $sum: '$totalAmountPaise' },
    bookingsCount: { $sum: 1 },
  },
}
```

`$sum` is MongoDB's addition operator.

```js
amountPaise: { $sum: '$totalAmountPaise' }
```

means: add the `totalAmountPaise` value from every matched booking.

```js
bookingsCount: { $sum: 1 }
```

means: add one for every matched booking, which creates a document count.

`_id: null` means all matched bookings belong to one summary group.

## Daily totals: group by business calendar day

`getDailyRevenue(filter, dateField)` groups by a formatted date:

```js
_id: {
  $dateToString: {
    date: `$${dateField}`,
    format: '%Y-%m-%d',
    timezone: BUSINESS_TIME_ZONE,
  },
},
amountPaise: { $sum: '$totalAmountPaise' },
bookingsCount: { $sum: 1 },
```

`dateField` is passed only by server code as either `actualEndAt` or `paidAt`.

```js
date: `$${dateField}`
```

becomes either:

```js
date: '$actualEndAt'
// or
date: '$paidAt'
```

The leading `$` means “read this field from each booking document.”

Dates are stored as UTC instants, but `timezone: BUSINESS_TIME_ZONE` makes a booking at 00:15 India
time count toward the correct Indian business date.

`bookingsCount: { $sum: 1 }` counts each booking in the day group. It is separate from the money total:
four paid bookings can total ₹850 when some of those bookings have a zero amount.

## `$project` shapes the response

After grouping, MongoDB stores the day in the grouping key `_id`:

```js
{ _id: '2026-10-01', amountPaise: 85000, bookingsCount: 4 }
```

This projection returns a cleaner API object:

```js
{ $project: { _id: 0, date: '$_id', amountPaise: 1, bookingsCount: 1 } }
```

- `_id: 0` excludes the internal grouping key.
- `date: '$_id'` creates a `date` field from that key.
- `amountPaise: 1` includes the already-calculated field; it does **not** set it to one.
- `bookingsCount: 1` includes the already-calculated count; it does **not** set the count to one.

The response becomes:

```js
{ date: '2026-10-01', amountPaise: 85000, bookingsCount: 4 }
```

## Service revenue: `$unwind`, `$group`, and `$first`

`getServiceRevenue()` needs one revenue bucket per service, while a booking can contain several service
snapshots:

```js
Booking.aggregate([
  { $match: filter },
  { $unwind: '$services' },
  { $group: {
    _id: '$services.serviceId',
    name: { $first: '$services.name' },
    revenuePaise: { $sum: '$services.pricePaise' },
    bookingsCount: { $sum: 1 },
  } },
  { $sort: { revenuePaise: -1, name: 1 } },
  { $project: { _id: 0, serviceId: '$_id', name: 1, revenuePaise: 1, bookingsCount: 1 } },
]);
```

**Requirement:** calculate completed-booking service revenue without allowing later catalogue edits to
rewrite history.

`$unwind` produces one row per stored service snapshot. Grouping by `serviceId` gives one bucket per
service. `$first` retains one snapshot name from that bucket; `$sum` adds snapshot prices and counts
line items. The final `$project` hides MongoDB's internal grouping key and exposes it as `serviceId`.

> Current limitation: if a catalogue service is renamed, historical snapshots for the same `serviceId`
> can have different names. Because there is no sort before `$group`, `$first` may choose either
> historical name for the analytics label. Revenue remains correct because it sums stored snapshot
> prices. When service-name reporting needs a defined rule, add a sort before grouping or return a
> dedicated current/reporting label.

## Billed and collected use different dates deliberately

```js
getDailyRevenue(billedInRange, 'actualEndAt');
getDailyRevenue(collectedInRange, 'paidAt');
```

- **Billed** belongs to the day the work completed.
- **Collected** belongs to the day staff marked the completed booking paid.

The controller merges those two arrays by date to return one daily row. This is reporting, not a
payment ledger: a booking has one paid/unpaid state and no partial payments yet.
