# Backend architecture

The Node.js/Express backend is located in `backend/src` and uses MongoDB through Mongoose.

## Current structure

```text
backend/src/
├── config/       # Environment and database configuration
├── controllers/  # Authentication controllers
├── middlewares/  # Authentication and authorization middleware
├── modules/      # Domain modules, including business type and registration
├── routes/       # Express route registration
├── scripts/      # Explicit platform-data seed scripts
├── utils/         # Shared backend helpers, including tenant scoping
└── server.js      # Application startup
```

## Tenant model

A business is the tenant boundary. Registration creates a `Business` and its `OWNER` user in one
MongoDB transaction. `Resource`, `Client`, and `Booking` are tenant-owned models with a required
`businessId`; their APIs derive that value from the authenticated user rather than accepting it from
the client. The Resource `{ businessId, resourceType }`, Client `{ businessId, mobile }`, and Booking
calendar/resource indexes support their tenant-scoped queries. Future business-owned records follow
the same rule.

Bookings may be `PENDING` without scheduled times, or become `SCHEDULED` when both planned times are
provided. Booking creation verifies that its client and resources belong to the authenticated tenant,
and rejects overlap with an active scheduled booking for any assigned resource. `PATCH /api/bookings/:id`
edits client, resources, schedule, or notes only while allowed by the current lifecycle state; adding a
valid schedule to a pending booking makes it scheduled. `PATCH /api/bookings/:id/status` accepts only a
permitted next status, sets actual service timestamps on check-in/completion server-side, and records the
authenticated user and time in `statusHistory`. Check-in requires active tenant resources, assigns them in
the same operation, and prevents a resource from serving two checked-in bookings at once. A booking may select an existing client or create a new
tenant-owned client in the same MongoDB transaction. `GET /api/bookings/:id` applies the same tenant filter
as the list endpoint and returns populated client/resource summaries for the detail workspace; token and
queue functionality remains deferred.

`utils/tenant-scope.js` centralizes this policy for controllers: `tenantFilter()` adds the verified
tenant to database queries, `tenantData()` adds it to new documents, and `tenantId()` supplies it
for direct tenant lookups. Each helper sets `businessId` after caller-provided data, so request data
cannot override the authenticated tenant.

`BusinessType` is platform-managed reference data. A `Business` stores `businessTypeId`, and owner
registration accepts only an active referenced type. Resource creation verifies the submitted type
against the authenticated business's active `BusinessType`; it also verifies any linked user belongs
to that same business. Initial types are created with
`npm run seed:business-types`; seed data is not a runtime hardcoded allow-list.

`routes/index.routes.js` is the API composition point. It mounts public authentication routes and
applies authentication before mounting protected module routes; `app.js` mounts this router at
`/api`.

The authenticated dashboard summary combines tenant-scoped booking and resource counts without
accepting a business identifier. Its earned-revenue figures use completed bookings' server-recorded
`actualEndAt`; its manual collected/outstanding split never processes a payment or changes a bill.

Owners manage staff through the tenant-scoped users module. Its create endpoint accepts no client
role or `businessId`: it always creates a `STAFF` user for the authenticated owner's business.
