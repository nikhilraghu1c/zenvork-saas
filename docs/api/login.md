# Login API

## Active endpoint

```http
POST /api/login
```

## Request body

```json
{
  "email": "owner@example.com",
  "password": "password"
}
```

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
    "role": "OWNER",
    "businessId": "..."
  }
}
```

## Error response

Invalid input, an unknown email, and an incorrect password all return HTTP `401` with the same
response to prevent account enumeration.

```json
{ "message": "Invalid email or password" }
```
