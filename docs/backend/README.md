# Backend learning guide

These guides explain the reasoning behind Zenvork's existing backend code. They complement the API
documents: API documents describe the contract; these documents explain how Express, Mongoose, and
MongoDB implement it.

## Suggested reading order

1. [Express request flow](express-request-flow.md) — how an HTTP request reaches a controller.
2. [Booking queries and lifecycle](booking-queries-and-lifecycle.md) — tenant-scoped lookups,
   availability, lifecycle changes, and pagination.
3. [MongoDB aggregation](mongodb-aggregation.md) — how dashboard and revenue totals are calculated.
4. [Tenant security patterns](tenant-security.md) — why every business-owned query uses a tenant scope.

## Module guides

- [Auth module](auth-module.md)
- [Business module](business-module.md)
- [Client module](client-module.md)
- [Resource module](resource-module.md)
- [Service module](service-module.md)
- [Users module](users-module.md)
- [Booking module](booking-queries-and-lifecycle.md)
- [Dashboard module](dashboard-module.md)
- [Analytics module](analytics-module.md)

## Keep learning guides current

When a backend change alters a module's route, validation, schema, controller flow, query, lifecycle
rule, security rule, index, or reporting logic, update both:

1. the relevant API/architecture document describing the public contract; and
2. the matching guide in this folder explaining why the implementation works.

For a new backend module, add a `<module>-module.md` guide and link it here in the same change. Keep
examples aligned with checked-in code; do not document planned behaviour as if it already exists.

Every module guide should explicitly cover the parts that apply to it:

```text
responsibility and routes
→ validation
→ model/indexes
→ controller queries and writes
→ lifecycle/state rules (or explicitly say none exists yet)
→ authentication, authorization, tenant safety, and error handling
```

For every important database query, write the explanation in this order:

```text
business requirement being solved
→ actual query from the controller
→ each field/operator and how MongoDB evaluates it
→ example input/output or edge case when useful
→ reason this query is safer/faster/correct for the requirement
```

The purpose is to teach how to write the query, not merely state that the query exists. Do not add
practice-question sections unless they are explicitly requested.

## How to learn from a feature

For any endpoint, read in this order:

```text
route → middleware → validation → controller → Mongoose query → response
```

For example, start `PATCH /api/bookings/:id` at
`backend/src/modules/booking/booking.routes.js`, then follow its controller and validation function.
Use the matching API document to understand the public request/response contract.

## Important terms

- **Express**: the Node.js web framework that receives HTTP requests and sends responses.
- **Middleware**: code that runs before a controller; Zenvork uses it for authentication and roles.
- **Controller**: code that coordinates validation, business rules, database work, and the response.
- **Mongoose model**: the JavaScript interface to a MongoDB collection, such as `Booking`.
- **MongoDB query**: criteria that choose documents, for example `{ status: "COMPLETED" }`.
- **Aggregation pipeline**: several database stages run in order to calculate grouped results.
- **Tenant**: one business. Tenant scoping prevents one business from reading another business's data.
