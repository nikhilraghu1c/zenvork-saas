# Platform administration API

All endpoints require an authenticated `PLATFORM_ADMIN`; platform administration is not tenant-scoped.

## Businesses

- `GET /api/admin/businesses` lists businesses with their platform-managed business type and owner
  contact metadata.
- `POST /api/admin/businesses` creates an active business and owner. It accepts `businessName`,
  `businessTypeId`, `ownerName`, `email`, `mobile`, and optional `planExpiresAt`. The server creates
  a random temporary password and returns it only in this response.
- `PATCH /api/admin/businesses/:id/status` accepts `{ "status": "ACTIVE" | "SUSPENDED" }`.
- `PATCH /api/admin/businesses/:id/plan-expiry` accepts `{ "planExpiresAt": "ISO date" | null }`.
- `POST /api/admin/businesses/:id/reset-owner-password` generates and returns a one-time temporary
  owner password. Responses containing temporary passwords must never be logged.

Suspended and expired businesses cannot sign in or use tenant APIs.

## Change password

```http
POST /api/change-password
```

Authenticated users submit `{ "currentPassword", "newPassword" }`. New passwords require at least
8 characters including uppercase, lowercase, number, and symbol, and must differ from the current
password. The endpoint updates
`passwordChangedAt` and replaces the current session cookie.
