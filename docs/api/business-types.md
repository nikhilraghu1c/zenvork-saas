# Business types API

## Registration endpoint

```http
GET /api/admin/business-types/active
```

The endpoint requires an authenticated `PLATFORM_ADMIN` because only platform administrators can
register businesses.
It is registered in `backend/src/modules/admin/admin.routes.js`.

## Successful response

The response contains active platform-managed business types and their active resource types.

```json
{
  "businessTypes": [
    {
      "id": "...",
      "code": "SALON",
      "name": "Salon",
      "iconName": "content_cut",
      "resourceTypes": [
        { "code": "STYLIST", "name": "Stylist", "isPerson": true, "isActive": true },
        { "code": "CHAIR", "name": "Chair", "isPerson": false, "isActive": true }
      ]
    }
  ]
}
```

Each resource type includes `isPerson` (default `false`), indicating whether optional login-account
linking is supported. Stylist and Doctor are seeded as person types. The seed only inserts missing
business types; it does not update existing catalog records. New non-person types, such as rooms,
use `isPerson: false`.

Salon seed configuration includes Chair (`CHAIR`) as an active non-person resource type, alongside Stylist.

## Platform management

Platform administrators manage the catalogue through the following endpoints. All require
`PLATFORM_ADMIN` and are not tenant-scoped.

- `GET /api/admin/business-types` lists active and inactive business types, including their embedded
  resource-type configuration.
- `POST /api/admin/business-types` accepts `code`, `name`, and optional `iconName`. A code uses
  uppercase letters, numbers, and underscores and is immutable after creation.
- `PATCH /api/admin/business-types/:id` accepts `name` and/or `iconName`.
- `PATCH /api/admin/business-types/:id/status` accepts `{ "isActive": true | false }`.

Resource types are managed through `/api/admin/resource-types`; see
[Platform administration API](admin.md#resource-types). They remain embedded in their owning
`BusinessType` record, so each business type can allow a different set of resource types.

Deactivation retains existing businesses and history, but removes the type from future business
registration and resource provisioning.
