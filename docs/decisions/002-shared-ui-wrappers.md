# ADR 002: Wrap Angular Material in shared Zenvork UI components

- Status: Accepted
- Date: 2026-09-08

## Context

Direct use of Angular Material in every page would duplicate styling decisions and make visual/API
changes expensive across the product.

## Decision

Create small shared Zenvork wrapper components over Angular Material when a reusable UI primitive is
needed. Begin with the minimum behavior required by the first consuming page and extend the same
wrapper only when a real need emerges.

## Consequences

Pages remain focused on domain flow and consume a stable Zenvork UI API. Angular Material upgrades
and theme-specific adaptations are localized in shared components.
