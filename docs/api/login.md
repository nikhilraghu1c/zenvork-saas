# Login API

## Active endpoint

```http
POST /api/login
```

## Request body

```json
{
  "identifier": "owner@example.com",
  "password": "password"
}
```

`identifier` accepts either a registered email address or a 10-digit mobile number.

## Successful response

The endpoint returns HTTP `200`, safe user data, and sets an HttpOnly `accessToken` cookie. The JWT
is not returned in the response body.

```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "name": "Owner Name",
    "email": "owner@example.com",
    "mobile": "9876543210",
    "role": "OWNER",
    "businessId": "..."
  }
}
```

## Error response

Invalid input, an unknown email or mobile number, and an incorrect password all return HTTP `401` with the same
response to prevent account enumeration.

```json
{ "message": "Invalid credentials" }
```
