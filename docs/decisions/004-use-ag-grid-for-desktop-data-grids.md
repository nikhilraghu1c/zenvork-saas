# ADR 004: Use AG Grid Community for desktop data grids

- Status: Accepted
- Date: 2026-09-11

## Context

Staff and future operational modules need sortable, resizable, dense desktop tables. Building those
behaviors from plain HTML tables would duplicate interaction and accessibility work across modules.

## Decision

Use AG Grid Community through `AppDataGridComponent` for desktop data grids. The shared wrapper
owns its Zenvork theme and standard behavior, while each feature supplies its rows and columns.
Use a feature-owned card presentation on mobile where a grid is not practical.

## Consequences

Desktop modules gain consistent table behavior without adopting a second broad component suite.
AG Grid Community is intentionally limited to data grids; Angular Material remains the primary UI
foundation. Advanced Enterprise-only capabilities are not assumed.
