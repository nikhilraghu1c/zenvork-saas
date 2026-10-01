# Service module learning guide

**Code:** `backend/src/modules/service/`.

## Responsibility

The service catalogue holds currently offerable services: their name, description, price in paise,
duration in minutes, and active state. A booking copies a service snapshot at creation, so changing the
catalogue later does not rewrite historical booking revenue.

## Route permissions

```text
GET   /api/services           authenticated owner or staff
GET   /api/services/options   authenticated owner or staff; active only
GET   /api/services/:id       authenticated owner or staff
POST  /api/services           owner only
PATCH /api/services/:id       owner only
```

The route layer uses `authorize('OWNER')` for catalogue mutations, while controller queries still use
`tenantFilter()` to protect every service ID lookup.

## Validation and database queries

**Requirement:** booking forms must list only active services, using only the fields needed to choose a
service.

Creation/update validation checks accepted fields before a write. The booking form uses a narrower,
active-only query:

```js
Service.find(tenantFilter(req, { isActive: true }))
  .select('name pricePaise durationMinutes')
  .sort({ name: 1, _id: 1 });
```

Here, `{ isActive: true }` excludes retired services; `tenantFilter()` adds the business equality
condition; `select()` keeps the payload small; and alphabetical `sort()` makes options predictable.
Direct lookups validate the ObjectId, then use `findOne(tenantFilter(req, { _id }))`, never an unscoped
`findById()`.

### Full catalogue and update lookup

**Requirement:** list all services for management, then safely load one tenant-owned service for edit.

```js
Service.find(tenantFilter(req, listFilter))
  .select('name description pricePaise durationMinutes isActive createdAt updatedAt')
  .sort({ isActive: -1, name: 1, _id: 1 })
  .lean();

Service.findOne(tenantFilter(req, { _id: req.params.id }));
```

The list accepts only validated filters. The update lookup intentionally does not use `.lean()` because
the controller changes properties on the returned Mongoose document and calls `.save()` afterwards.

### Insert query

**Requirement:** create a service under the authenticated business and let MongoDB enforce name
uniqueness within that business.

```js
Service.create(tenantData(req, serviceData));
```

The unique compound index is the final check for duplicate service names within one tenant.

## Unique name handling

The schema index is:

```js
serviceSchema.index({ businessId: 1, name: 1 }, { unique: true });
```

This permits different businesses to have a service called “Haircut,” but prevents duplicate service
names within one business. MongoDB error code `11000` means a unique-index conflict; the controller
turns it into HTTP `409 Conflict`.

## Update pattern

`validateServiceUpdate()` records which optional fields were supplied, for example `hasPricePaise`.
The controller changes only those fields and then calls `await service.save()`. This avoids replacing
the whole document with a partial PATCH request.

## Lifecycle

```text
Create active service → selectable in new bookings → deactivate → stays visible in historical snapshots
```

Deactivation does not change completed booking snapshots, preserving historical service and price data.
