# Users API

All user-management endpoints require the HttpOnly authentication cookie established by login.
Only an `OWNER` can use them. The backend derives `businessId` from the authenticated owner, so it
must not be supplied in a request.

## List staff users

```http
GET /api/users
```

Returns only `STAFF` users belonging to the owner's business. Password hashes and tenant IDs are
never returned.

## Create a staff user

```http
POST /api/users
```

```json
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "mobile": "9876543210",
  "password": "secure-password"
}
```

`name`, `mobile`, and `password` are required. `email` is optional for staff, but must be valid and
globally unique when supplied. Mobile numbers are globally unique. The request cannot send `role`
or `businessId`; this endpoint always creates a `STAFF` account for the authenticated owner's
business.

The endpoint returns HTTP `201` with a success message only.

```json
{ "message": "Staff user created successfully" }
```
