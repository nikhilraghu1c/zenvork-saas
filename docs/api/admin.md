# Platform administration API

All endpoints require an authenticated `PLATFORM_ADMIN`; platform administration is not tenant-scoped.

## Businesses

- `GET /api/admin/businesses` lists businesses with their platform-managed business type and owner
  contact metadata.
- `POST /api/admin/businesses` creates an active business and owner. It accepts `businessName`,
  `businessTypeId`, `ownerName`, `email`, `mobile`, and optional `planExpiresAt`. The server creates
  a random temporary password and returns it only in this response.
- `PATCH /api/admin/businesses/:id/status` accepts `{ "status": "ACTIVE" | "SUSPENDED" }`.
- `PATCH /api/admin/businesses/:id/plan-expiry` accepts `{ "planExpiresAt": "ISO date" | null }`.
- `POST /api/admin/businesses/:id/reset-owner-password` generates and returns a one-time temporary
  owner password. Responses containing temporary passwords must never be logged.

Suspended and expired businesses cannot sign in or use tenant APIs.

## Business types

Business types are platform-managed catalogue records. Their resource-type configuration remains
embedded in the same record.

- `GET /api/admin/business-types` lists active and inactive business types.
- `GET /api/admin/business-types/active` returns active types and active resource types for the
  business-registration form.
- `POST /api/admin/business-types` accepts `code`, `name`, and optional `iconName`.
- `PATCH /api/admin/business-types/:id` accepts `name` and/or `iconName`; the code is immutable.
- `PATCH /api/admin/business-types/:id/status` accepts `{ "isActive": true | false }`.

Deactivation keeps existing businesses and history, but prevents the type from being selected for
new business registration or tenant resource provisioning.

## Resource types

Resource types are platform-managed configuration entries scoped to one business type. All endpoints
below require `PLATFORM_ADMIN` and do not accept a tenant/business ID.

- `GET /api/admin/resource-types` lists active and inactive resource-type configurations, including
  their owning business type.
- `POST /api/admin/resource-types` accepts `businessTypeId`, `code`, `name`, and `isPerson`.
  `code` is uppercase letters, numbers, and underscores and is immutable after creation.
- `PATCH /api/admin/resource-types/:businessTypeId/:code` accepts `{ "name": "..." }` only.
- `PATCH /api/admin/resource-types/:businessTypeId/:code/status` accepts `{ "isActive": true | false }`.

Deactivation prevents new tenant resources of that type from being created. It does not delete existing
resources or alter booking history. `isPerson` is also immutable because it governs whether tenant
resources of the type may link to a staff login.

## Change password

```http
POST /api/change-password
```

Authenticated users submit `{ "currentPassword", "newPassword" }`. New passwords require at least
8 characters including uppercase, lowercase, number, and symbol, and must differ from the current
password. The endpoint updates
`passwordChangedAt` and replaces the current session cookie.
