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
`/app` routes. Dashboard, Booking, Clients, Staff, Resources, Services, Reminders, AI Assistant, and owner-only Analytics are implemented; the remaining visible app
navigation routes use a temporary shared preview page until their workspaces are implemented. Feature
pages are lazy-loaded. Each feature owns a `<module>.routes.ts` route array beside its code;
`app.routes.ts` only composes the two layouts and lazy-loads those feature route arrays.
New route navigation scrolls to the top; browser Back and Forward restore the prior scroll position.
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
`put`, `patch`, and `delete` methods. Its requests include credentials so the browser can use Zenvork's
HttpOnly authentication cookie. The local backend domain is `http://localhost:4001`; its CORS
configuration allows the Angular development origin at `http://localhost:4200`. Module-owned
services define feature endpoints and request/response types by composing that client; for example,
business registration belongs to `modules/register`. The registration module fetches active business
types from `GET /api/business-types` and submits the selected `businessTypeId`; it does not hardcode
the selectable platform types. A global HTTP interceptor clears cached user metadata and redirects
protected `401` responses to login; login-request `401` responses remain available to the form as
invalid-credential feedback.

## State management

Use component state and module services for simple, page-local state. Introduce NgRx SignalStore only
when a feature needs shared data or UI state across multiple pages/components, such as resources,
staff, or bookings. Concrete adoption triggers are reusable cached records, coordinated optimistic
updates with rollback/undo, polling or real-time updates, and long-running cross-page workflows. Keep
each feature store inside its module (`modules/<feature>/store/`) and let it call that module's service;
the service remains responsible for HTTP requests.

Do not add NgRx preemptively or duplicate the current `AuthService` state. Before adding a store,
propose the smallest appropriate store and obtain approval. Consider classic NgRx Store and Effects
later for genuinely cross-feature workflows, WebSocket events, or optimistic updates.

## Planned localization

- Add an owner- or staff-selectable UI locale, beginning with `en-IN` and `hi-IN`.
- Translate application labels, lifecycle display labels, validation copy, and frontend-mapped API error
  codes using runtime translation dictionaries; do not translate user-entered client, service, or note
  data.
- Make `BusinessDateTimeService`, money formatting, and Angular locale data use the active locale while
  retaining the business timezone and INR as independent settings.
- Return stable backend error codes before translating server-originated failures in the frontend.

## Planned authentication and layout hardening

- After the backend provides `GET /api/me`, restore and validate the cookie session at application
  startup instead of using `sessionStorage` metadata alone for client route access.
- Use Angular's `takeUntilDestroyed()` for `AppLayoutComponent` breakpoint and router subscriptions.

## Business date and time

`BusinessDateTimeService` is the single frontend source for date/time formatting, business-day
query bounds, and conversion of native booking form date/time values into UTC API timestamps. Its
current hardcoded IANA timezone is `Asia/Kolkata`; `BusinessDatePipe` lets templates use the same
rules with `value | businessDate`, or explicit `date`, `compactDate`, `time`, `dateTime`,
`monthDay`, and `year` formats. All stored and API timestamps remain ISO UTC values. Replacing the
hardcoded timezone with a tenant business setting later changes the display and scheduling rules in
one frontend service; backend date-range reporting will use that same persisted setting separately.

## Resource workspace

Resources use lazy routes `/app/resources`, `/app/resources/new`, and `/app/resources/:id`.
Owners can create resources; both owners and staff can list and inspect tenant-owned resources.
The add form loads tenant-specific types from `GET /api/resources/options` and offers an optional
link to the owner or an existing staff account. Desktop lists use the shared grid; smaller screens
use resource cards. Detail pages resolve records from the tenant-scoped list, display actual active
status and timestamps, and leave unsupported management, service, and booking controls disabled.

## Client workspace

`/app/clients` is a lazy-loaded tenant client directory. It obtains records through `GET /api/clients`
and filters the loaded list locally by client name, mobile number, or email, avoiding a request for each
keystroke. Desktop uses the shared grid; smaller screens use compact client cards.

## Booking workspace

`/app/booking` is a lazy-loaded operational list. It initially applies the current Asia/Kolkata
business-day range, then allows resource/assignment filters and a lifecycle status filter. Pending-only
results are sorted oldest first; scheduled views are chronological. The desktop list uses the shared grid and becomes accessible cards on smaller
screens. Both card and client-cell navigation lead to lazy-loaded `/app/booking/:id`, which loads
the tenant-owned booking detail workspace directly. The detail page presents only supported booking
data: client contact details, resources, planned/actual schedule, notes, lifecycle timestamps, and
booking metadata. `/app/booking/new` is a lazy-loaded operational form that selects an existing
tenant client or creates one inline, assigns only configured resource types, and creates a pending
booking unless staff provide the complete business-local date/start/end schedule.
The list persists its selected view and active filters in query parameters when staff open details or
the editor, so returning restores the prior work context. New bookings and completed edit flows return
to the booking list.
`BookingService` also provides typed PATCH calls for booking detail edits (including scheduling and
rescheduling) and lifecycle status transitions; the detail-page controls will use those calls as the
editing workflow is added. The booking list action menu and detail header expose only valid next
lifecycle actions, then refresh their tenant-scoped booking data after a successful update. Check-in
opens the same resource-selection dialog from desktop and mobile entry points; it submits resource
assignment and the check-in transition together. The dialog separates resources by configured type
and provides one type-filtered dropdown per type, avoiding an unmanageable mixed list for larger
businesses.

## Shared display pipes

Pure standalone display pipes live in `core/pipes`. `InitialsPipe` (`name | initials`) is shared by
staff, resource, and sidebar avatars. It uses the first and last words, returns one uppercase initial
for a single-word name, normalizes whitespace, and returns an empty string for missing names.
`BusinessDatePipe` delegates date/time display to the configured business timezone.

## Analytics workspace

`/app/analytics` is an owner-guarded, lazy-loaded revenue workspace. It requests fixed reporting
periods from `GET /api/analytics/revenue` and presents billed, collected, outstanding, daily, and
service-level revenue without calculating money totals in the browser.

## Reminder workspace

`/app/reminders` is a lazy-loaded manual appointment-reminder workspace for owners and staff. It shows
three equal-width mobile-safe tabs—To send, Upcoming, and Sent today—with matching counts above them.
Upcoming is intentionally preview-only; WhatsApp, copy, mark-sent, and skip actions appear only in To
send. Marking a reminder sent moves it to Sent today, which is a daily confirmation log rather than an
active queue. WhatsApp opens a prefilled client message and Copy uses the browser clipboard; neither
action changes server state. After opening WhatsApp, a confirmation dialog asks staff whether they
sent the message before `ReminderService` records it as sent. Staff can still explicitly mark a
reminder sent or skipped.

## AI Assistant workspace

`/app/ai-assistant` is a lazy-loaded workspace available to authenticated owners and staff. Its
desktop layout keeps conversation history inside the assistant workspace; on mobile, that same
history opens in a bottom sheet while the chat remains full-width. Conversations are private to the
signed-in user and tenant. The backend chooses the configured reply provider and never sends tenant
business records to it in this phase. Assistant Markdown is rendered by `ngx-markdown` and sanitized
through a narrow DOMPurify allow-list before it reaches the DOM. Inactive conversations, including
their embedded messages, expire after seven days; paid retention tiers can extend that policy later.

### Planned conversation scaling

The initial assistant API returns a complete short-lived conversation after a message is sent. Before
supporting high-volume conversations, change message retrieval to cursor pagination, return only the
newly persisted user/assistant messages from the send endpoint, and use a virtualized message list in
the frontend. This avoids repeatedly transferring and rendering an entire long conversation while
preserving the existing conversation summary list. The virtualized message list should also render a
date separator (for example, `21 Sept`) before each day's messages.
