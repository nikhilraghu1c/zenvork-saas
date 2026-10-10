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
MongoDB transaction. `Resource`, `Client`, `Booking`, and `Reminder` are tenant-owned models with a required
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
as the list endpoint and returns populated client/resource summaries for the detail workspace; token
functionality remains deferred. The authenticated Reminder module maintains one manual appointment
reminder for each scheduled booking; recording a reminder outcome never changes Booking `updatedAt`.

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

Owner-only revenue analytics is mounted at `/api/analytics`. It aggregates only tenant-owned completed
bookings and shares `utils/reporting-period.js` with the dashboard so business-day boundaries are
consistent. Completed billing uses `actualEndAt`; collection reporting uses `paidAt`, written by the
payment-status endpoint when staff mark a booking as paid. This is intentionally a reporting timestamp,
not a payment ledger or provider transaction record.

Owners manage staff through the tenant-scoped users module. Its create endpoint accepts no client
role or `businessId`: it always creates a `STAFF` user for the authenticated owner's business.

The Assistant module keeps HTTP/database orchestration in its controller and routes generated replies
through `assistant.service.js`. The service provides every adapter with server-defined behavior
instructions, a bounded recent-message context (20 messages), and at most two matching entries from
the in-module curated feature catalog. The catalog is the Phase 1 source of truth for implemented
Zenvork product guidance. It covers account access, registration/business types, dashboard, bookings,
payment status, clients, staff, resources, services, analytics, reminders, and Assistant conversation
history; it is selected by `knowledge/assistant-knowledge.service.js`. The mock and Gemini adapters
share the same `generateReply({ messages, systemInstruction })` contract. The default remains mock;
Gemini is enabled only by server environment configuration. No tenant business records are sent to a
provider—only the authenticated user's private conversation text and server-owned feature guidance.
`instructions/assistant-system-instruction.js` owns the provider-facing behavior instructions, including
privacy, unsupported-data, and urgent-health response rules.
Before generating a reply, `classification/assistant-request-classifier.service.js` applies local safety
checks and asks the configured provider for a schema-constrained classification:
`PRODUCT_HELP`, `BUSINESS_GUIDANCE`, `UNSAFE_OR_RESTRICTED`, or `OUT_OF_SCOPE`.
`instructions/assistant-classification-instruction.js` owns the classification contract. Product help
receives catalog context and business guidance receives the base behavior instruction. Restricted and
unrelated requests receive local replies without a response-generation provider request. The classifier
intentionally does not yet support data-query or action-request classifications; those will be added
alongside controlled business tools.
`AI_CLASSIFIER_MODEL` can select a separate compatible classification model and falls back to
`AI_MODEL` when it is unset.
