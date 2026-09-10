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
        { "code": "STYLIST", "name": "Stylist", "isActive": true }
      ]
    }
  ]
}
```
