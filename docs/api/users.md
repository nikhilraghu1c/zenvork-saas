# Users API

All user-management endpoints require the HttpOnly authentication cookie established by login.
Only an `OWNER` can use them. The backend derives `businessId` from the authenticated owner, so it
must not be supplied in a request.

## List staff users

```http
GET /api/users
```

Returns tenant-owned staff accounts with active accounts first, then in name and ID order. Each item
includes `isActive`, which controls whether that staff account may sign in.

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
business. `bookingAccessScope` is optional and defaults to `NONE`; accepted values are `NONE`,
`OWN_AND_UNASSIGNED`, and `ALL`. `canSendReminders` is optional and defaults to `false`; it grants a
staff account access to the Reminder workspace and its manual send/skip actions. Owners always retain
both booking and reminder control.

The endpoint returns HTTP `201` with a success message only.

```json
{ "message": "Staff user created successfully" }
```

If either login identifier is already registered, it returns HTTP `409`:

```json
{ "message": "This mobile number or email is already used by another account" }
```

## Change staff access

```http
PATCH /api/users/:id/status
```

```json
{ "isActive": false }
```

Only the tenant owner may update a staff account belonging to their own business. Setting `isActive`
to `false` prevents new logins and invalidates the staff member's existing session on its next protected
request. It does not delete bookings, linked resources, or historical records. Send `true` to reactivate
the same account; its globally unique mobile/email identifiers cannot be reused for another account.

The response returns the updated safe staff record:

```json
{
  "message": "Staff member deactivated",
  "user": {
    "_id": "...",
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "mobile": "9876543210",
    "role": "STAFF",
    "isActive": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

## Update staff user

```http
PATCH /api/users/:id
```

```json
{
  "bookingAccessScope": "OWN_AND_UNASSIGNED",
  "canSendReminders": true
}
```

Only the tenant owner can use this generic staff update endpoint. It currently accepts exactly these two
operational permission fields and cannot alter the staff member's name, credentials, role, active status,
or tenant. The response returns the same safe staff summary as the status endpoint.
