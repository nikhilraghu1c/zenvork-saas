# Business types API

## Active endpoint

```http
GET /api/business-types
```

The endpoint is public because it supplies the active business-type choices for owner registration.
It is registered in `backend/src/routes/auth.routes.js`.

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
