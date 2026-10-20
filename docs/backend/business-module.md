# Business module learning guide

**Code:** `backend/src/modules/business/` and `backend/src/routes/auth.routes.js`.

## Responsibility

`Business` is the tenant boundary. It records the business name, a platform-managed
`businessTypeId`, its `OWNER`, lifecycle `status`, optional `planExpiresAt`, and the
`createdByAdminId` that provides platform audit ownership.

Businesses and owners are created only by the platform-admin module; public business registration is
retired. See [Platform admin module](admin-module.md) for the transactional creation flow.

## Business type configuration

`BusinessType` is platform-managed reference data. It defines each supported business type and its
allowed resource types, so clinic and salon behavior remains configuration-driven rather than being
separate applications.

```js
BusinessType.find({ isActive: true })
  .select('code name iconName resourceTypes')
  .sort({ name: 1 })
  .lean();
```

`GET /api/admin/business-types/active` returns this active catalogue for the platform-admin creation form. The
creation controller independently checks the submitted ID with
`BusinessType.findOne({ _id: businessTypeId, isActive: true })`, so a browser cannot create a business
with a disabled or invented type.

Platform administrators manage all catalogue entries through `GET`, `POST`, and `PATCH`
`/api/admin/business-types` endpoints. Codes are permanent identifiers; names and Material icon names
can change. Deactivation retains existing businesses, but prevents new business registration and new
resource provisioning under that type.

## Lifecycle

`status` is `ACTIVE` or `SUSPENDED`. `planExpiresAt` is either a date or `null`, where `null` means no
expiry has been configured. Tenant login and authentication middleware reject a suspended business or
an active business whose plan expiry is in the past. This blocks both new login attempts and existing
tenant sessions without deleting tenant records.
