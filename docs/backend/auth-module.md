# Auth module learning guide

**Code:** `backend/src/routes/auth.routes.js`, `backend/src/controllers/auth/`, and
`backend/src/middlewares/`.

## Responsibility

Authentication proves who a staff member, owner, or platform administrator is. Authorization then
decides whether that user may use a protected feature.

```text
POST /api/login
→ find user by email or mobile
→ compare submitted password with bcrypt hash
→ issue short-lived access JWT in HttpOnly cookie
→ create hashed, rotating refresh session
```

## Login query

**Requirement:** find exactly the account attempting to log in, whether the person supplied an email or
mobile number, and load its password hash only for comparison.

```js
const userLookup = isEmail ? { email: normalized.toLowerCase() } : { mobile: normalized };
const user = await User.findOne({ ...userLookup, isActive: { $ne: false } }).select('+password');
```

The `password` schema field has `select: false`, so normal user queries never accidentally return it.
Login explicitly opts in with `.select('+password')`, then calls the model method
`user.comparePassword(password)`. The plain password is never stored or returned.

`userLookup` contains one equality condition: either `{ email: '...' }` or `{ mobile: '...' }`.
`findOne()` returns the first matching user or `null`; login identifiers are unique, so there should be
at most one. `.select('+password')` overrides only this schema field's normal `select: false` setting.
For example, `{ mobile: '9876543210' }` can return the matching user; an unknown mobile returns `null`.

## Validation, errors, and session lifecycle

Login accepts an email or 10-digit Indian mobile as `identifier`, plus a string password. Invalid input,
an unknown account, and an incorrect password all return the same `401` response, so the API does not
reveal which accounts exist.

```text
login → access + refresh cookies → userAuth verifies access cookie → refresh rotates session → logout revokes session
```

`AuthSession` stores a SHA-256 hash, user ID, and expiry for each opaque refresh token. Its TTL index
removes expired records. The raw token remains only in the browser's HttpOnly cookie. Refresh finds the
hash, validates the user and tenant lifecycle, then atomically replaces the hash with a new token. This
prevents an old token from being reused after a successful refresh. A deleted or explicitly deactivated
user cannot keep using an otherwise valid access or refresh session because `userAuth` and refresh both
reload the user from MongoDB and reject `isActive === false`. For owners and staff, login, refresh, and
`userAuth` also reject `SUSPENDED` or expired accounts with `403`. `PLATFORM_ADMIN` users have no
business and bypass that tenant lifecycle check.

## JWT and middleware

The JWT contains the user ID, business ID, and role. `userAuth` verifies its signature, reloads the
user, and attaches that trusted user document to `req.user`.

```js
req.user = user;
next();
```

Every protected module route is mounted after `userAuth`. `authorize('OWNER')` is an additional role
check used for owner-only actions such as service changes, staff management, and revenue analytics;
`authorize('PLATFORM_ADMIN')` protects `/api/admin`. `userAuth` rejects tokens issued before
`passwordChangedAt`, so changing or resetting a password ends the prior session.

## Cookie security

Login sends access and refresh tokens as HttpOnly cookies. JavaScript in the browser cannot read either
cookie, which reduces the impact of many XSS mistakes. The refresh token is opaque, persisted only as a
one-way hash, and configured through `REFRESH_TKN_EXPIRE` (default `30d`; whole-number `s`, `m`, `h`,
or `d` duration). Login and logout share cookie attributes so clearing uses the same path and security
settings.
