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
  "businessType": "SALON",
  "ownerName": "Owner Name",
  "email": "owner@example.com",
  "password": "password"
}
```

The backend normalizes business type to uppercase. The accepted types are defined by `BUSINESS_TYPES`
in `backend/src/modules/business/business.model.js`.

## Successful response

The endpoint returns HTTP `201` with a message, the created business, and a safe owner object. It
does not currently return a JWT.

## Error response

Validation and known failures return one user-facing message:

```json
{ "message": "Business name is required" }
```

The frontend must show this message rather than replacing it with a generic error.
