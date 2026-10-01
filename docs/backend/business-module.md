# Business module learning guide

**Code:** `backend/src/modules/business/` and `backend/src/routes/auth.routes.js`.

## Responsibility

The business module creates the tenant boundary. One registration creates exactly one `Business` and
its first `OWNER` user. `BusinessType` is platform-managed reference data that configures allowed
resource types such as people, rooms, chairs, or equipment.

## Registration uses a transaction

```js
await session.withTransaction(async () => {
  const businessId = new mongoose.Types.ObjectId();
  newUser = new User({ ..., role: 'OWNER', businessId });
  newBusiness = new Business({ _id: businessId, ..., ownerId: newUser._id });
  await newUser.save({ session });
  await newBusiness.save({ session });
});
```

The two documents reference each other, so the controller creates `businessId` first. A transaction
makes registration atomic: if either save fails, MongoDB rolls both back. Without it, an owner could
exist without a business or a business without an owner.

## Validation, queries, and lifecycle

`validateBusinessRegistration()` parses the public body before database work. Registration then checks
for an existing user and an active business type:

```js
User.exists({ $or: [{ email }, { mobile }] });
BusinessType.findOne({ _id: businessTypeId, isActive: true });
```

**Requirement:** reject a duplicate account and prevent registration with a disabled/nonexistent type.

In the first query, `$or` means at least one array condition must match: same email **or** same mobile.
`exists()` returns only a lightweight existence result because the controller does not need the user data.
The second query requires both `_id` equality and `isActive: true` on the same business-type document.
The User unique indexes remain the final duplicate protection; `11000` is mapped to `409 Conflict`.

```text
Visitor → registered Business + OWNER → authenticated tenant
```

There is no business edit, suspension, ownership-transfer, or deletion endpoint yet. Those future
operations affect the tenant boundary and should be transactional and auditable.

## Business type configuration

`GET /api/business-types` is public because registration needs it before login. It returns only active
types and active resource types. Creation of a business validates that the submitted type exists and is
active; the browser cannot invent a type ID.

### Important public catalogue query

**Requirement:** show only currently selectable business/resource types on the registration screen.

```js
BusinessType.find({ isActive: true })
  .select('code name iconName resourceTypes')
  .sort({ name: 1 })
  .lean();
```

`find({ isActive: true })` excludes disabled platform types. `select()` avoids returning internal fields,
`sort()` gives the registration UI a stable alphabetical list, and `lean()` is appropriate because this
is read-only data. The controller also removes inactive nested resource types before responding. For
example, a type with `isActive: false` never reaches the browser, even if it remains in the collection.
