# ADR 001: Use Angular Material 3 for the shared UI foundation

- Status: Accepted
- Date: 2026-09-08

## Context

The frontend needs accessible Material components that visually align with the Zenvork dark design
system. Legacy M2 color inputs do not provide the desired semantic system-role model.

## Decision

Use Angular Material 3 dark theming with Cyan as primary, a custom Purple tertiary tonal palette,
and Material's red error role. Enable Material system variables for semantic CSS usage.

## Consequences

Material controls use M3 semantic roles and accessible dark-theme tones. Legacy M2 APIs such as
`color="accent"` do not select a component color in M3. Exact brand colors remain available through
Zenvork CSS tokens for custom UI.
