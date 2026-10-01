# Auth module learning guide

**Code:** `backend/src/routes/auth.routes.js`, `backend/src/controllers/auth/`, and
`backend/src/middlewares/`.

## Responsibility

Authentication proves who a staff member or owner is. Authorization then decides whether that user
may use a protected feature.

```text
POST /api/login
→ find user by email or mobile
→ compare submitted password with bcrypt hash
→ sign JWT
→ store JWT in HttpOnly cookie
```

## Login query

**Requirement:** find exactly the account attempting to log in, whether the person supplied an email or
mobile number, and load its password hash only for comparison.

```js
const userLookup = isEmail ? { email: normalized.toLowerCase() } : { mobile: normalized };
const user = await User.findOne(userLookup).select('+password');
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
login → signed cookie → userAuth verifies each protected request → logout clears cookie
```

The server has no separate session collection today. A deleted user cannot keep using an otherwise valid
token because `userAuth` reloads the user from MongoDB for every protected request.

## JWT and middleware

The JWT contains the user ID, business ID, and role. `userAuth` verifies its signature, reloads the
user, and attaches that trusted user document to `req.user`.

```js
req.user = user;
next();
```

Every protected module route is mounted after `userAuth`. `authorize('OWNER')` is an additional role
check used for owner-only actions such as service changes, staff management, and revenue analytics.

## Cookie security

Login sends the token as an HttpOnly cookie. JavaScript in the browser cannot read an HttpOnly cookie,
which reduces the impact of many XSS mistakes. Login and logout share `authCookieOptions` so clearing
uses the same cookie attributes.
