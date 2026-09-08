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
public navigation and public routes; `AppLayoutComponent` will own authenticated navigation and
guarded `/app` routes. Feature pages are lazy-loaded. The current public landing route is `/`.

## Component conventions

- Components are standalone.
- Every component has `.ts`, `.html`, `.scss`, and `.spec.ts` files.
- Component SCSS is parent-scoped and responsive.
- Pages compose shared Zenvork UI wrappers instead of directly depending on Angular Material when a wrapper exists.
