# Tenant security patterns

Zenvork is multi-tenant: every business is a tenant, and staff must never access another business's
clients, bookings, resources, services, or reporting data.

## Do not trust browser-supplied tenant IDs

This is unsafe:

```js
Booking.find({ businessId: req.query.businessId });
```

A user could edit the URL and request another business's ID.

Instead, authentication loads the signed-in user and gives controllers a server-trusted value:

```js
req.user.businessId
```

## `tenantFilter()` protects reads, updates, and deletes

```js
const tenantFilter = (req, filter = {}) => ({
  ...filter,
  businessId: req.user.businessId,
});
```

Usage:

```js
Booking.findOne(tenantFilter(req, { _id: req.params.id }));
```

The database receives both conditions. A booking ID from another tenant simply returns `null`/`404`.

Use this with `find`, `findOne`, `exists`, `countDocuments`, `updateOne`, and aggregation filters for
all business-owned data.

## `tenantData()` protects new documents

```js
const tenantData = (req, data = {}) => ({
  ...data,
  businessId: req.user.businessId,
});
```

The trusted `businessId` comes after `...data`, so even if a malicious request body includes a
`businessId`, it is overwritten by the authenticated user's business ID.

## Authentication is not authorization

Authentication answers:

```text
Who is this user?
```

Authorization answers:

```text
May this user perform this action?
```

Zenvork first uses `userAuth` to establish `req.user`. Owner-only routes then use the role middleware
inside the module router. Both checks are needed; a valid staff session should not automatically gain
owner-only analytics or user-management access.

## Response safety

Tenant safety also applies to output. Booking controllers return a public shape through
`toPublicBooking()` instead of returning raw Mongoose documents. This avoids exposing internal IDs such
as `businessId`, `createdBy`, and status-history staff identifiers.

## Checklist for a new business-owned module

Before adding a new module such as Follow-ups or Memberships, verify:

1. Its schema has a required `businessId`.
2. Create operations use `tenantData(req, ...)`.
3. Every lookup, update, and delete uses `tenantFilter(req, ...)`.
4. Referenced client/service/resource IDs are verified within the same tenant.
5. Role checks are applied for privileged actions.
6. API responses expose only fields needed by the frontend.
7. Useful queries have tenant-first indexes, normally beginning with `businessId`.
