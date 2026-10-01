# Users module learning guide

**Code:** `backend/src/modules/users/`.

## Responsibility

This module manages business staff login accounts. It does not manage clients. Only owners can list or
create staff, and the server always assigns the `STAFF` role and authenticated business ID.

## Routes, validation, and list query

```text
GET  /api/users → authorize('OWNER') → getStaffUsers
POST /api/users → authorize('OWNER') → validateStaffCreation → createStaffUser
```

The list query is tenant and role scoped:

```js
User.find(tenantFilter(req, { role: 'STAFF' }))
  .select('name email mobile role createdAt updatedAt')
  .sort({ name: 1, _id: 1 });
```

Validation intentionally does not accept `role` or `businessId` from the browser.

**Requirement:** an owner sees only staff accounts from their own business. `role: 'STAFF'` excludes the
owner, `tenantFilter()` adds the trusted business ID, `select()` omits the password hash, and the sort
creates a stable alphabetical list.

### Duplicate and insert queries

**Requirement:** prevent a new staff member from reusing a globally unique login mobile/email, then
create the account with server-controlled role and tenant.

```js
const existingUser = await User.exists({ $or: duplicateCriteria });

await User.create(tenantData(req, {
  name, email, mobile, password, role: 'STAFF',
}));
```

`$or` means a user is a duplicate when either mobile matches, or email matches when an email was given.
This query is intentionally platform-wide because login identifiers are globally unique. The server sets
`role: 'STAFF'` after browser data, so an owner cannot accidentally create another owner through this API.

## Password model logic

The Mongoose pre-save hook hashes a new or changed password:

```js
if (!this.isModified('password')) return;
this.password = await bcrypt.hash(this.password, 12);
```

The `isModified()` check prevents an already-hashed password from being hashed again during unrelated
user saves. `comparePassword()` is a model method so login controllers do not need to know bcrypt
details.

## Duplicate protection and race conditions

The controller first checks likely duplicate mobile/email values for a friendly early response. It still
handles MongoDB error `11000`, because two requests can pass the check at the same moment before either
has saved. The database unique index is the final authority.

The returned conflict text deliberately does not reveal whether an email or mobile already exists.

## Lifecycle and current boundary

```text
Owner creates staff account → staff can log in → staff operates permitted business features
```

There is no staff update, deactivate, password-reset, role-change, or removal endpoint yet. A later
deactivation design must decide how to revoke active sessions and preserve historical resource links.
