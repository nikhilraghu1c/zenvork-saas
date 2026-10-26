# Authentication

## Product rule

Only platform administrators, business owners, and staff authenticate. Clients are records managed
by a business and never have login accounts. `PLATFORM_ADMIN` users have no `businessId`, are seeded
outside public APIs, and use the isolated `/admin` workspace.

## Current backend state

Public business registration is unavailable. A platform administrator creates a business and its
owner through `/api/admin/businesses`; the generated temporary password is returned once. `POST /api/login`
accepts an email address or mobile number in `identifier`, plus a password, then sets an HttpOnly
`accessToken` cookie. Its JWT contains the user ID, business ID, and role (`OWNER` or `STAFF`). Login
also creates an opaque, database-backed HttpOnly `refreshToken` cookie. The cookies default to
`SameSite=Strict` locally and are marked `Secure` in production. Deployments whose
frontend and API use different sites configure `COOKIE_SAME_SITE=none`; they must use HTTPS and an
explicit `CLIENT_ORIGIN` allowlist. `POST /api/logout` revokes the refresh session and clears both
cookies with the same attributes.

Login returns only safe user data; the JWT is not included in the JSON response. For tenant users,
that safe metadata includes the active business's display name so the authenticated sidebar can identify
the workspace without a second API request; platform administrators receive `businessName: null`.

## Frontend implementation

The frontend sends login and logout requests through `AuthService`, which uses the shared
credentialed API client so the browser accepts and sends the HttpOnly cookies. Only safe user metadata
from the login response is retained in `sessionStorage`; neither token is available to JavaScript.
`AuthService.getCurrentUser()` exposes that safe metadata for TypeScript callers, while `user$`
provides reactive updates.

At application startup, `AuthService` calls `GET /api/me` before route guards run. This restores safe
metadata from a valid access cookie, so a directly opened tab works without another tab's
`sessionStorage`. If the access cookie is expired, it calls `POST /api/refresh`, which rotates the
opaque refresh session and receives a fresh short-lived access cookie.

The global HTTP interceptor uses the same single-flight refresh operation after a protected-request
`401`, then retries that request once. A failed refresh clears cached metadata and returns the user to
login. The backend stores only a SHA-256 hash of each refresh token in `AuthSession`; raw refresh tokens
are never persisted. Logout revokes its current refresh session. A password change revokes all remembered
refresh sessions, then creates a new one only for the browser that changed the password.

`authGuard` uses restored client-side metadata to control UI routing. The backend remains the security
boundary for protected API requests.

The frontend's global HTTP interceptor retries a protected-request `401` through refresh before
clearing cached metadata and navigating to `/login?reason=expired`. It preserves an internal
`/app/...` return path and sends the user there after a successful login. Session, login, logout, and
refresh endpoints are excluded from that retry loop. `403` and network/server failures do not trigger
an automatic logout redirect.

Owner-management routes use `ownerGuard` as an additional UI-routing check, and owner-only sidebar
items are hidden from staff users. Backend role authorization remains mandatory for every API.

After a successful login, platform administrators navigate to `/admin/dashboard`; tenant users
navigate to `/app/dashboard`. The sidebar logout action
calls `POST /api/logout`, clears safe client metadata only after a successful response, and returns
the user to `/login`.
`/api/admin/*` requires `PLATFORM_ADMIN`. Tenant routes centrally reject suspended or expired
businesses. A password change sets `passwordChangedAt`; authentication rejects JWTs issued before
that timestamp.
