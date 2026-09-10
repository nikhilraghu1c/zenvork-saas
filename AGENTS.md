# Zenvork engineering guide

## Product boundaries

- Zenvork is a B2B multi-tenant booking and management SaaS.
- Only business owners and staff authenticate. Clients are tenant-owned records and do not log in.
- Tenant isolation is mandatory for every business-owned record and API operation.
- Current working direction: keep one application with business-type presets/configuration for labels, defaults, and enabled features, and dedicated domain modules when business rules differ. This architecture is provisional; evaluate alternatives and revise the proposal when a better approach is identified.
- Prefer simple, explicit code over forced generalization. Share behavior when its rules match and reuse reduces complexity; small duplication is acceptable when an abstraction would complicate development or the owner experience. See [ADR 003](docs/decisions/003-simple-modular-business-architecture.md).

## Frontend conventions

- Use Angular standalone components with external `.ts`, `.html`, `.scss`, and `.spec.ts` files.
- Lazy-load feature routes and keep public and authenticated layouts separate at the routing level.
- Pages use shared Zenvork UI wrappers over raw Angular Material components where a wrapper exists.
- Keep component styles responsive and nested below one component parent class.
- Use `src/styles/_tokens.scss` for exact Zenvork visual values and `--mat-sys-*` values for Material M3 semantic roles.

## Backend integration

- Verify the live contract in `backend/src` before implementing a frontend API call.
- Display API error messages returned as `{ "message": "..." }` to the user where appropriate.

## Documentation maintenance

For every implementation change, assess whether it changes architecture, routing, authentication,
API contracts, tenant behavior, shared component APIs, design tokens/theming, setup, or an accepted
technical decision. If it does, update the relevant file in `docs/` in the same change.

Do not create documentation for trivial implementation-only edits. Keep documentation concise,
fact-based, and consistent with the checked-in code. Create a new ADR for a durable technical
decision that has meaningful alternatives or consequences.
