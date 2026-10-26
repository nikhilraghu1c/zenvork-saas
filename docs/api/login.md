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

The endpoint returns HTTP `200`, safe user data, and sets HttpOnly `accessToken` and `refreshToken`
cookies. Neither token is returned in the response body.

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

## Restore the current session

```http
GET /api/me
```

Requires a valid `accessToken` cookie. It returns the same safe `user` object as login and lets a new
tab restore its signed-in state without exposing a token to JavaScript.

## Refresh an expired access session

```http
POST /api/refresh
```

Requires a valid `refreshToken` cookie and no request body. The server rotates the opaque refresh token,
sets fresh `accessToken` and `refreshToken` cookies, and returns a safe `user` object. An expired,
revoked, reused, inactive, or unavailable-account refresh session returns `401` or `403` and clears the
authentication cookies.

## Log out

```http
POST /api/logout
```

Revokes the current refresh session and clears both authentication cookies.
