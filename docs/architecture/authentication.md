# Authentication

## Product rule

Only business owners and staff authenticate. Clients are records managed by a business and never
have login accounts.

## Current backend state

Registration creates a business and owner but does not authenticate that owner. `POST /api/login`
accepts an email and password, then sets an HttpOnly `accessToken` cookie. Its JWT contains the
user ID, business ID, and role (`OWNER` or `STAFF`). The cookie uses `SameSite=Strict` and is marked
`Secure` in production. `POST /api/logout` clears that cookie.

Login returns only safe user data; the JWT is not included in the JSON response.

## Frontend implication

The registration UI must keep its success state in place because registration does not authenticate
the owner. Login requests must use `withCredentials: true` so the browser accepts the authentication
cookie. Before adding a registration redirect or route-guard behavior, verify the relevant backend
route and response in `backend/src` and update this document and the API contract in the same change.
