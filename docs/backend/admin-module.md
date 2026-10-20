# Platform admin module learning guide

**Code:** `backend/src/modules/admin/`.

## Responsibility and authorization

This module manages the platform's business accounts. It is deliberately not tenant-scoped: a
`PLATFORM_ADMIN` has `businessId: null` and can operate across businesses. The parent API router runs
`userAuth`, and the admin router then applies `authorize('PLATFORM_ADMIN')` before every endpoint.

```text
userAuth → reload user and validate session → authorize PLATFORM_ADMIN → admin controller
```

Tenant users cannot reach these routes, and platform-admin requests never accept a browser-supplied
tenant ID.

## Business creation transaction

`POST /api/admin/businesses` accepts only business identity, business type, owner identity, and an
optional plan expiry. It does not accept a password, role, status, or creator ID.

```js
await session.withTransaction(async () => {
  const businessType = await BusinessType.findOne({
    _id: input.businessTypeId,
    isActive: true,
  }).session(session);
  const businessId = new mongoose.Types.ObjectId();
  owner = new User({ ..., businessId, role: 'OWNER', password: generatedPassword });
  business = new Business({ ..., _id: businessId, ownerId: owner._id, createdByAdminId: req.user._id });
  await owner.save({ session });
  await business.save({ session });
});
```

The active-type query prevents assigning a retired platform type. The transaction preserves the
two-way owner/business reference: either both documents are created or neither is. The server creates
the password with cryptographic randomness and returns it only in the successful response; it must
never be logged or persisted in plaintext.

## Platform list and dashboard queries

`GET /api/admin/businesses` intentionally has no `tenantFilter()`: it is a platform-admin query. It
sorts newest first and populates the business type and owner data required by the admin UI.

```js
Business.find()
  .select(businessProjection)
  .sort({ createdAt: -1 })
  .populate('businessTypeId', 'code name iconName')
  .populate('ownerId', 'name email mobile')
  .lean();
```

`GET /api/admin/summary` counts active, suspended, and plans expiring in the next 30 calendar days.
The expiry filter is `{ planExpiresAt: { $gt: now, $lte: expiringAt } }`, so already expired plans and
businesses with `planExpiresAt: null` are excluded. Its recent-business query is limited to five rows.

## Lifecycle and password recovery

`PATCH /api/admin/businesses/:id/status` accepts exactly `ACTIVE` or `SUSPENDED`. It changes business
availability without deleting tenant records. Both login and `userAuth` load a tenant user's business,
so suspension takes effect for new and already authenticated tenant sessions.

`PATCH /api/admin/businesses/:id/plan-expiry` accepts an ISO date or `null`. An expired plan is treated
as unavailable by login and `userAuth` even when its status remains `ACTIVE`.

`POST /api/admin/businesses/:id/reset-owner-password` verifies that the target owner belongs to that
business and has the `OWNER` role. It generates a new password, sets `passwordChangedAt` to `null`, and
returns the password once. On the owner's next password change, `passwordChangedAt` invalidates all
tokens issued before that change.

## Business-type configuration

`BusinessType` records are platform configuration, not tenant-owned data. The admin catalogue API
lists active and inactive types, creates a new type with an immutable code, updates its name/icon, and
activates or deactivates it. Deactivation preserves existing businesses and history while preventing
future business registration and resource provisioning for that type.

## Resource-type configuration

`BusinessType.resourceTypes` remains the source of truth for which types a tenant can create. The
admin resource-type endpoints flatten those embedded entries only for the platform list UI; they do not
create a tenant-visible global catalog. `POST /api/admin/resource-types` appends a validated entry to
the selected `BusinessType`; the duplicate-code check is scoped to that same business type.

Codes and `isPerson` are immutable once stored. Tenant `Resource` documents persist the code, and
`isPerson` controls whether a resource can link to a tenant user. `PATCH .../status` changes only
`resourceTypes.$.isActive`: it retires the type from future tenant resource creation without deleting
existing resources or their booking history.

## Errors

Validation failures return `400`, invalid identifiers return `400`, absent businesses or owners return
`404`, and duplicate owner email/mobile values return a generic `409` message. The generic conflict
message avoids revealing which account identifier already exists.
