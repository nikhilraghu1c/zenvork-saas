# Users module learning guide

**Code:** `backend/src/modules/users/`.

## Responsibility

This module manages business staff login accounts. It does not manage clients. Only owners can list,
create, activate, or deactivate staff, and the server always assigns the `STAFF` role and authenticated
business ID.

## Routes, validation, and list query

```text
GET  /api/users → authorize('OWNER') → getStaffUsers
POST /api/users → authorize('OWNER') → validateStaffCreation → createStaffUser
PATCH /api/users/:id/status → authorize('OWNER') → validateStaffStatusUpdate → updateStaffStatus
PATCH /api/users/:id → authorize('OWNER') → validateStaffUpdate → updateStaffUser
```

The list query is tenant and role scoped:

```js
User.find(tenantFilter(req, { role: 'STAFF' }))
  .select('name email mobile role isActive createdAt updatedAt')
  .sort({ isActive: -1, name: 1, _id: 1 });
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

The returned conflict text says that the mobile number **or** email is already used, but does not reveal
which identifier or account caused the conflict.

## Access lifecycle

```text
Owner creates staff account → staff can log in → staff operates permitted business features
→ owner deactivates account → access ends, history remains → owner may reactivate same account
```

`PATCH /api/users/:id/status` accepts only `{ isActive: boolean }`. Its lookup combines the trusted
tenant ID, target user ID, and `role: 'STAFF'`, so an owner cannot deactivate an owner or a user from a
different business. It changes neither credentials nor resource links.

Login searches for accounts where `isActive !== false`, and `userAuth` reloads the user on every
protected request. Therefore deactivation blocks a new login and makes an existing token unusable on
its next API request. Older documents that predate the field are treated as active for a safe rollout.

There is no full staff-profile edit, password-reset, role-change, or removal endpoint yet.

The generic staff update endpoint is intentionally narrower than a full staff editor. It updates only
`bookingAccessScope` and `canSendReminders`; account identity, credentials, role, lifecycle state, and
tenant ownership remain outside its request contract.

## Booking access scope

New staff accounts receive `bookingAccessScope: 'NONE'` and `canSendReminders: false` unless the owner
selects another value at creation. All active staff may view tenant bookings, but `NONE` cannot create
or change one; `OWN_AND_UNASSIGNED` permits only linked-resource and unassigned work; `ALL` permits all
tenant booking mutations. `canSendReminders` independently grants Reminder workspace access and manual
reminder actions. Existing records without either field are treated as denied until an owner explicitly
grants access.
