# Resources API

All resource endpoints require the HttpOnly authentication cookie established by login. The backend
derives the tenant identity from the authenticated user; clients must not send `businessId`.

## List resources

```http
GET /api/resources
```

Returns only resources owned by the authenticated user's business.

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
