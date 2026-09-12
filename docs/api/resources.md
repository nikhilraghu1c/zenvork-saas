# Resources API

All resource endpoints require the HttpOnly authentication cookie established by login. The backend
derives the tenant identity from the authenticated user; clients must not send `businessId`.

## List resources

```http
GET /api/resources
```

Returns `{ resources: [...] }` containing only resources owned by the authenticated user's business.
Each record includes `_id`, `name`, `resourceType`, `isActive`, `linkedUserId`, `createdAt`, and
`updatedAt`, and `isPerson` (resolved from the business-type catalog). The linked account is an ID or `null`, not a populated user record.

## Resource type options

```http
GET /api/resources/options
```

Returns `{ resourceTypes: [{ code, name, isPerson }] }` for active resource types on the authenticated
business's active business type. No business ID is accepted from the client. An inactive or missing
business type returns an empty options list; a missing business returns `401`. Both owners and
staff may read this configuration.

## Create a resource

```http
POST /api/resources
```

Only an `OWNER` can create a resource.

```json
{
  "name": "Priya",
  "resourceType": "STYLIST",
  "linkedUserId": null
}
```

`resourceType` must be an active type configured on the business's active `BusinessType`. If
`linkedUserId` is provided, it must refer to a user in the same business.

The request must not include `businessId`; the server assigns it from the verified JWT.

The endpoint returns HTTP `201` with a success message only. Resource data will be added to the
response when the frontend resource-management flow needs it.

```json
{ "message": "Resource created successfully" }
```

Account linking is optional for person types (`isPerson: true`). Non-person types reject non-null
`linkedUserId` with `400`. The flag is read from the business-type catalog, never from the request.
The frontend clears and hides account linking when a non-person type is selected.
