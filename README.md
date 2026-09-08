# Zenvork

Zenvork is a B2B, multi-tenant booking and management SaaS for service businesses. The initial
business types are salons and clinics.

Only business owners and staff authenticate. Clients are records managed by a business and never
have user accounts. Every business is an isolated tenant.

## Stack

- Frontend: Angular 21, standalone components, Angular Material 3
- Backend: Node.js, Express, MongoDB/Mongoose
- Planned platform capabilities: Redis, BullMQ, WebSockets, and AI-assisted workflows

## Repository layout

```text
.
├── UI/zenvork-ui/  # Angular frontend
├── backend/        # Express API and MongoDB models
├── docs/           # Architecture, API contracts, design system, and ADRs
└── AGENTS.md       # Engineering conventions and documentation-maintenance rules
```

## Local development

### Frontend

```bash
cd UI/zenvork-ui
npm install
npm start
```

The Angular development server runs at `http://localhost:4200` by default.

### Backend

Create `backend/.env` with the required database and runtime values:

```env
MONGO_URI=<your-mongodb-connection-string>
PORT=3000
NODE_ENV=development
ACCESS_TKN_SECRET=<secret>
ACCESS_TKN_EXPIRE=<expiry>
```

Then run:

```bash
cd backend
npm install
npm run dev
```

## Current product direction

- Public landing page is available at `/`.
- The next frontend milestone is business-owner registration followed by the authenticated dashboard.
- Business registration currently uses `POST /api/register-business`; see the contract before integrating.

## Documentation

Start with the [documentation index](docs/README.md).

- [Frontend architecture](docs/architecture/frontend.md)
- [Backend architecture](docs/architecture/backend.md)
- [Authentication status](docs/architecture/authentication.md)
- [Design system and Material 3 theming](docs/design-system/theming.md)
- [Business registration API](docs/api/business-registration.md)
- [Architecture decision records](docs/decisions/README.md)

## Contribution conventions

Read [AGENTS.md](AGENTS.md) before making a cross-cutting change. If a change affects architecture,
API contracts, authentication, tenant behavior, shared UI APIs, or theming, update the relevant
document in `docs/` within the same change.
