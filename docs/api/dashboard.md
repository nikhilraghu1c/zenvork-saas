# Dashboard API

All dashboard endpoints require the HttpOnly authentication cookie. Every result is scoped to the
authenticated user's business; clients cannot supply a tenant identifier.

## Summary

```http
GET /api/dashboard/summary?period=today
```

`period` is optional and may be `today` (default), `week`, or `month`. Date boundaries currently use
India Standard Time. The response includes the active range and the immediately preceding equal-length
range used for comparison.

```json
{
  "summary": {
    "period": "today",
    "range": {
      "from": "2026-09-21T18:30:00.000Z",
      "to": "2026-09-22T18:30:00.000Z"
    },
    "bookingsCount": 8,
    "revenue": {
      "earnedPaise": 185000,
      "previousEarnedPaise": 132000,
      "collectedPaise": 150000,
      "outstandingPaise": 35000
    },
    "noShows": { "count": 1, "resolvedBookings": 6, "rate": 0.1666666667 },
    "activeStaffCount": 4,
    "topServices": [
      {
        "serviceId": "65f123456789012345678903",
        "name": "Haircut",
        "revenuePaise": 65000,
        "bookingsCount": 3
      }
    ],
    "topStaff": [
      {
        "resourceId": "65f123456789012345678902",
        "name": "Rahul",
        "resourceType": "STYLIST",
        "bookingsCount": 6
      }
    ]
  }
}
```

`bookingsCount` counts scheduled appointments whose planned start is within the selected period.
Revenue includes only bookings completed within the period, based on their server-recorded
`actualEndAt`. `collectedPaise` and `outstandingPaise` split that same earned revenue by its current
manual payment status. The no-show rate is `NO_SHOW / (COMPLETED + NO_SHOW)` for outcomes recorded
within the period, so unresolved upcoming appointments do not distort it. `activeStaffCount` counts
enabled resources whose configured business type marks them as people; it is not an attendance count.

`topServices` contains at most three services by snapshot line-item revenue from completed bookings
within the selected `period`; manual extra charges are not attributed to a service.
`topStaff` contains at most three enabled person resources by completed-booking count in the selected
period. Rooms, chairs, and other non-person resource types are excluded.
