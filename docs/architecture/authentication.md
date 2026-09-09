# Authentication

## Product rule

Only business owners and staff authenticate. Clients are records managed by a business and never
have login accounts.

## Current backend state

The active registration endpoint creates a business and owner, but does not currently return a JWT
or establish an authenticated session. Login/logout routes and session behavior are present only as
commented or legacy code in the current backend route configuration.

## Frontend implication

The current registration UI shows its success state in place after a successful API call. Do not assume
registration authenticates the owner until the backend contract changes. Before adding login,
registration redirect, or route-guard behavior, verify the relevant backend route and response in
`backend/src` and update this document and the API contract in the same change.
