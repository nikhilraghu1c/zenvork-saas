# Business registration API

## Active endpoint

```http
POST /api/register-business
```

Source: `backend/src/routes/auth.routes.js`.

## Request body

```json
{
  "businessName": "Example Studio",
  "businessTypeId": "<active-business-type-id>",
  "ownerName": "Owner Name",
  "email": "owner@example.com",
  "mobile": "9876543210",
  "password": "password"
}
```

Fetch active business types from `GET /api/business-types` and submit the selected `id`. The backend
validates that the selected type exists and is active. Mobile must be a unique 10-digit Indian mobile
number beginning with 6–9.

## Successful response

The endpoint returns HTTP `201` with a success message only. It does not currently return created
records or a JWT.

```json
{ "message": "Business and owner registered successfully" }
```

## Error response

Validation and known failures return one user-facing message:

```json
{ "message": "Business name is required" }
```

The frontend must show this message rather than replacing it with a generic error.

When a submitted email or mobile value is already registered, the endpoint returns HTTP `409` with
the generic message below. It deliberately does not reveal which identifier matched an account.

```json
{ "message": "Unable to create business account" }
```
