# Material and design system

## Two styling layers

`UI/zenvork-ui/src/styles/_tokens.scss` contains exact Zenvork CSS custom properties for custom UI:
backgrounds, glass surfaces, shared data-grid surfaces, text, gradients, status colors, typography,
and radii.

`UI/zenvork-ui/src/styles/_material-theme.scss` defines the Angular Material 3 dark theme and emits
Material system variables.

## Material 3 roles

- Primary is Cyan for default Material interactions.
- Tertiary is the custom Zenvork Purple tonal palette; its tone 50 is `#7C4DFF`.
- Error uses Material's accessible red palette.

In dark mode, M3 semantic variables choose accessible tones automatically. For example,
`--mat-sys-tertiary` resolves to a light Purple tone, while
`--mat-sys-tertiary-container` and `--mat-sys-on-tertiary-container` form a darker Purple container
pair.

## Usage rule

- Use app tokens such as `--purple`, `--surface`, and `--border` for exact Zenvork custom styling.
- Use `--mat-sys-*` variables for semantic, light/dark-theme-aware styling and Material integration.
- Do not use legacy M2 `color="accent"` APIs with M3 components; create an M3 component variant or
  use a semantic system variable instead.
