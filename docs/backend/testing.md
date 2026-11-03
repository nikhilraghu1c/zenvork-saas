# Backend testing

Run the backend unit suite from `backend/`:

```bash
npm test
```

Zenvork uses Node's built-in `node:test` runner for the initial suite, so running tests requires no
separate test framework or test-only runtime dependency.

## Current coverage

- Booking request validation: allow-listed fields, client choice, line-item quantity, discounts,
  scheduling, lifecycle updates, payment updates, and list filters.
- Booking Mongoose lifecycle rules: initial status history, required schedule intervals, and required
  actual timestamps for checked-in and completed work.
- Booking controller validation boundaries: malformed or privilege-escalating HTTP requests return a
  `400` response before a database query is attempted.

These tests deliberately do not connect to a real database. Controller integration tests should be
added next with an isolated MongoDB instance so they can verify tenant-scoped queries, owner/staff
permissions, and lifecycle writes end to end.
