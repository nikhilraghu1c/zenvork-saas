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
└── server.js      # Application startup
```

## Tenant model

A business is the tenant boundary. Registration creates a `Business` and its `OWNER` user in one
MongoDB transaction. `Resource` is the first operational tenant-owned model; it has a required
`businessId`, and future resource APIs must derive that value from the authenticated user rather
than accepting it from the client. Its `{ businessId, resourceType }` index supports tenant-scoped
resource-type queries. Future business-owned records follow the same rule.

`BusinessType` is platform-managed reference data. A `Business` stores `businessTypeId`, and owner
registration accepts only an active referenced type. Initial types are created with
`npm run seed:business-types`; seed data is not a runtime hardcoded allow-list.
