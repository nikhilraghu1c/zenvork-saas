# Frontend architecture

The Angular application is located in `UI/zenvork-ui` and uses Angular 21 standalone components.

## Structure

```text
src/app/
├── core/        # Cross-cutting guards and services
├── layouts/     # Route-level public and authenticated shells
├── modules/     # Lazy-loaded page modules
└── shared/      # Reusable navigation and UI wrapper components
```

## Routing

Public and authenticated experiences use separate route-level layouts. `PublicLayoutComponent` owns
public navigation and public routes. `AppLayoutComponent` owns authenticated navigation and guarded
`/app` routes. Dashboard, Staff, and Resources are implemented; the remaining visible app navigation routes use
a temporary shared preview page until their workspaces are implemented. Feature pages are lazy-loaded.
The Staff module owns `/app/staff`, `/app/staff/new`, and `/app/staff/:id`. The current public routes
are `/`, `/register`, and `/login`.
Desktop app pages present their own primary headings. The app toolbar is shown only on mobile, where
it provides the navigation-drawer control without repeating the page title.

## Component conventions

- Components are standalone.
- Every component has `.ts`, `.html`, `.scss`, and `.spec.ts` files.
- Component SCSS is parent-scoped and responsive.
- Pages compose shared Zenvork UI wrappers instead of directly depending on Angular Material when a wrapper exists.
- Dense desktop data uses `AppDataGridComponent` (AG Grid Community); features own their column
  definitions and a mobile card presentation when appropriate.

## API services

`core/services/api.service.ts` owns the default API domain and generic `get`, `query`, `post`,
`put`, and `delete` methods. Its requests include credentials so the browser can use Zenvork's
HttpOnly authentication cookie. The local backend domain is `http://localhost:4001`; its CORS
configuration allows the Angular development origin at `http://localhost:4200`. Module-owned
services define feature endpoints and request/response types by composing that client; for example,
business registration belongs to `modules/register`. The registration module fetches active business
types from `GET /api/business-types` and submits the selected `businessTypeId`; it does not hardcode
the selectable platform types.

## State management

Use component state and module services for simple, page-local state. Introduce NgRx SignalStore only
when a feature needs shared data or UI state across multiple pages/components, such as resources,
staff, or bookings. Keep each feature store inside its module (`modules/<feature>/store/`) and let it
call that module's service; the service remains responsible for HTTP requests.

Do not add NgRx preemptively or duplicate the current `AuthService` state. Before adding a store,
propose the smallest appropriate store and obtain approval. Consider classic NgRx Store and Effects
later for genuinely cross-feature workflows, WebSocket events, or optimistic updates.

## Planned authentication and layout hardening

- After the backend provides `GET /api/me`, restore and validate the cookie session at application
  startup instead of using `sessionStorage` metadata alone for client route access.
- Add an HTTP interceptor that clears local auth metadata and redirects to `/login` after an
  authenticated API request returns `401`.
- Use Angular's `takeUntilDestroyed()` for `AppLayoutComponent` breakpoint and router subscriptions.

## Resource workspace

Resources use lazy routes `/app/resources`, `/app/resources/new`, and `/app/resources/:id`.
Owners can create resources; both owners and staff can list and inspect tenant-owned resources.
The add form loads tenant-specific types from `GET /api/resources/options` and offers an optional
link to the owner or an existing staff account. Desktop lists use the shared grid; smaller screens
use resource cards. Detail pages resolve records from the tenant-scoped list, display actual active
status and timestamps, and leave unsupported management, service, and booking controls disabled.

## Shared display pipes

Pure standalone display pipes live in `core/pipes`. `InitialsPipe` (`name | initials`) is shared by
staff, resource, and sidebar avatars. It uses the first and last words, returns one uppercase initial
for a single-word name, normalizes whitespace, and returns an empty string for missing names.
