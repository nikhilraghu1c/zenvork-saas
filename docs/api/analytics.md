# Analytics API

Analytics endpoints require the HttpOnly authentication cookie. Revenue analytics is owner-only and
is always scoped to the authenticated owner's business; clients cannot select a business ID.

## Revenue analytics

```http
GET /api/analytics/revenue?period=month
```

`period` is required and accepts `today`, `week`, or `month`. Reporting ranges use the current
business timezone (`Asia/Kolkata`) and return ISO UTC `range.from` and `range.to` bounds.

The response has this shape:

```json
{
  "period": "month",
  "range": { "from": "2026-09-01T18:30:00.000Z", "to": "2026-09-30T18:30:00.000Z" },
  "revenue": {
    "billedPaise": 124000,
    "billedBookingsCount": 18,
    "previousBilledPaise": 99000,
    "collectedPaise": 105000,
    "collectedBookingsCount": 15,
    "previousCollectedPaise": 83000,
    "outstandingPaise": 19000,
    "outstandingBookingsCount": 3,
    "extraChargesPaise": 4000
  },
  "daily": [{ "date": "2026-09-20", "billedPaise": 12000, "collectedPaise": 9500 }],
  "services": [{ "serviceId": "...", "name": "Haircut", "revenuePaise": 65000, "bookingsCount": 10 }]
}
```

Definitions:

- **Billed** is the total of completed bookings by `actualEndAt` in the selected period.
- **Collected** is the total of completed bookings marked `paid` by `paidAt` in the selected period.
- **Outstanding** is the total of bookings completed in the selected period that are currently
  `unpaid`.
- **Service revenue** uses immutable booking service snapshots, so later catalog price/name edits do
  not rewrite reporting history. `extraChargesPaise` is reported separately because it is not tied to
  a service.

This is operational reporting, not an accounting ledger: it does not model partial payments,
refunds, taxes, invoices, or payment-provider transactions.
