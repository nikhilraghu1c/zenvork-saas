# Client module learning guide

**Code:** `backend/src/modules/client/`.

## Responsibility

Clients are tenant-owned records. They are not application login users; owners and staff authenticate,
while clients are managed records used by bookings.

## Routes and controller flow

```text
GET  /api/clients → getClientList
POST /api/clients → validateClientCreation → createClient
```

Both routes receive authentication from the parent API router. The client controller then applies
`tenantFilter()` for reads and `tenantData()` for creation.

**Requirement:** show only the signed-in business's clients in a stable newest-first list.

```js
const clients = await Client.find(tenantFilter(req))
  .select('name mobile email notes createdAt updatedAt')
  .sort({ createdAt: -1, _id: -1 })
  .lean();
```

`tenantFilter(req)` adds `{ businessId: req.user.businessId }`, so `find()` cannot return another
business's clients. `select()` returns only the listed fields. In `sort`, `createdAt: -1` means newest
first and `_id: -1` resolves ties deterministically. `lean()` returns read-only plain objects.

### Create query

**Requirement:** insert a validated client into the authenticated business, regardless of request-body
tampering.

```js
await Client.create(tenantData(req, clientData));
```

`create()` inserts one document. `tenantData()` adds the trusted `businessId` after client input, so a
browser cannot create a client in another tenant. Unlike `find()`, `create()` returns a newly saved
Mongoose document; this controller does not need it, so it only returns a success message.

## Validation and lifecycle

`validateClientCreation()` checks the request shape; the schema then enforces name length, Indian mobile,
optional valid email, and required tenant identity. This is defense in depth: clear API validation plus
database-level protection for future write paths.

```text
Create client → select client for a booking → view client list
```

There is no edit, archive, merge, delete, or consent endpoint yet. A future delete operation must protect
historical bookings; archive/anonymise may be safer than deleting referenced client records.

## Schema and index

The schema stores name, Indian mobile, optional email, optional notes, and `businessId`. Its index is:

```js
clientSchema.index({ businessId: 1, mobile: 1 });
```

It supports tenant-first lookups by mobile. It is not unique, so the current product permits repeated
mobile values within a business; booking creation has its own client-choice rules.
