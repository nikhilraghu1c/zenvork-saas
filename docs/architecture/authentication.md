# Authentication

## Product rule

Only business owners and staff authenticate. Clients are records managed by a business and never
have login accounts.

## Current backend state

Registration creates a business and owner but does not authenticate that owner. `POST /api/login`
accepts an email address or mobile number in `identifier`, plus a password, then sets an HttpOnly
`accessToken` cookie. Its JWT contains the user ID, business ID, and role (`OWNER` or `STAFF`). The
cookie uses `SameSite=Strict` and is marked `Secure` in production. `POST /api/logout` clears that
cookie.

Login returns only safe user data; the JWT is not included in the JSON response.

## Frontend implementation

The registration UI keeps its success state in place because registration does not authenticate the
owner. The frontend sends login and logout requests through `AuthService`, which uses the shared
credentialed API client so the browser accepts and sends the HttpOnly cookie. Only safe user metadata
from the login response is retained in `sessionStorage`; the JWT is never available to JavaScript.
`AuthService.getCurrentUser()` exposes that safe metadata for TypeScript callers, while `user$`
provides reactive updates.

`authGuard` uses that client-side metadata to control UI routing. The backend remains the security
boundary for protected API requests. A future authenticated session-check endpoint is required to
validate the cookie after browser reload or expiry before relying on the client route state.

Owner-management routes use `ownerGuard` as an additional UI-routing check, and owner-only sidebar
items are hidden from staff users. Backend role authorization remains mandatory for every API.

After a successful login, the frontend navigates to `/app/dashboard`. The sidebar logout action
calls `POST /api/logout`, clears safe client metadata only after a successful response, and returns
the user to `/login`.
