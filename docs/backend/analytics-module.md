# Analytics module learning guide

**Code:** `backend/src/modules/analytics/` and `backend/src/utils/reporting-period.js`.

## Responsibility

`GET /api/analytics/revenue?period=today|week|month` is owner-only revenue reporting. It separates:

```text
Billed      completed work grouped by actualEndAt
Collected   completed paid bookings grouped by paidAt
Outstanding completed unpaid bookings grouped by actualEndAt
```

This is operational reporting, not a payment ledger. A booking has one paid/unpaid state; there are no
partial payments, refunds, invoices, or provider transactions yet.

## Route, validation, and lifecycle

The parent router authenticates the caller and the analytics router adds `authorize('OWNER')`. Only
`today`, `week`, and `month` are accepted; malformed values return `400`. Every aggregation begins with
`tenantFilter(req, ...)`, so a caller cannot select another business with a query parameter.

Analytics is a read model derived from booking lifecycle data:

```text
Completed + actualEndAt → billed/service revenue
Completed + paidAt + paid → collected revenue
Completed + unpaid → outstanding for its completion period
```

Payment transactions, refunds, or partial payments would require a ledger-based reporting model later.

## Why filters are functions

```js
const completedFilter = (start, end) => tenantFilter(req, {
  status: 'COMPLETED',
  actualEndAt: { $gte: start, $lt: end },
});
```

The function prevents repeated filter code and lets the controller calculate both the selected period
and the equal-length previous period with identical rules.

### Collected filter example

**Requirement:** identify the bookings whose money was collected in a reporting period, even if their
appointments were completed on an earlier day.

```js
const collectedFilter = (start, end) => tenantFilter(req, {
  status: 'COMPLETED',
  paymentStatus: 'paid',
  paidAt: { $gte: start, $lt: end },
});
```

This answers a precise reporting question: “Which completed bookings were marked paid in this period?”
It does not mean “which appointments took place in this period.”

## Summary, daily, and service calculations

- `getAmountSummary()` returns one amount/count total with `$group` and `$sum`.
- `getDailyRevenue()` turns each relevant timestamp into a business-calendar date, groups by it, then
  sums booking totals.
- `getServiceRevenue()` unwinds immutable booking service snapshots and groups by service ID.

See [MongoDB aggregation](mongodb-aggregation.md) for a stage-by-stage explanation of `$match`,
`$group`, `$sum`, `$sort`, `$project`, and `$unwind`.

### Daily revenue query shape

**Requirement:** return one billed/collected total per business calendar day without loading every
booking into Node.js.

```js
Booking.aggregate([
  { $match: filter },
  { $group: {
    _id: { $dateToString: {
      date: `$${dateField}`,
      format: '%Y-%m-%d',
      timezone: BUSINESS_TIME_ZONE,
    } },
    amountPaise: { $sum: '$totalAmountPaise' },
  } },
  { $sort: { _id: 1 } },
  { $project: { _id: 0, date: '$_id', amountPaise: 1 } },
]);
```

The controller calls this once with `actualEndAt` for billed work and once with `paidAt` for collected
money, then merges the two small result arrays by date.

### Summary and service query shapes

**Requirement:** return selected-period totals and identify which completed service line items generated
the revenue.

```js
Booking.aggregate([
  { $match: filter },
  { $group: {
    _id: null,
    amountPaise: { $sum: '$totalAmountPaise' },
    bookingsCount: { $sum: 1 },
  } },
]);
```

`_id: null` means all matched bookings form one summary group. `$sum: 1` counts the matched booking
documents; it does not sum money.

```js
Booking.aggregate([
  { $match: billedInRange },
  { $unwind: '$services' },
  { $group: {
    _id: '$services.serviceId',
    name: { $first: '$services.name' },
    revenuePaise: { $sum: '$services.pricePaise' },
    bookingsCount: { $sum: 1 },
  } },
  { $sort: { revenuePaise: -1, name: 1 } },
]);
```

This query counts service line items. A booking with two services contributes once to each selected
service's revenue/count.

## Payment timestamp rule

The payment-status controller sets `paidAt = new Date()` only when a completed booking moves from
unpaid to paid. Repeated `paid` requests do not change the original settlement time; moving back to
unpaid clears it. This makes collection reporting date-based rather than tied to appointment completion.
