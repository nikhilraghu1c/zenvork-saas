# Clients API

All client endpoints require the HttpOnly authentication cookie established by login. Owners and
staff can manage only clients belonging to their authenticated business. Requests must not send
`businessId`; the backend derives it from the verified user.

## List clients

```http
GET /api/clients
```

Returns `{ clients: [...] }`, sorted by name. Each client includes `_id`, `name`, `mobile`, optional
`email` and `notes`, plus `createdAt` and `updatedAt`. Tenant IDs are not returned.

## Create a client

```http
POST /api/clients
```

```json
{
  "name": "Asha Patel",
  "mobile": "9876543210",
  "email": "asha@example.com",
  "notes": "Prefers morning appointments"
}
```

`name` and a 10-digit Indian `mobile` number are required. `email` and `notes` are optional. The
endpoint rejects tenant-controlled and unknown request fields, returns `201` on success, and allows
multiple client records with the same mobile number within a business.
