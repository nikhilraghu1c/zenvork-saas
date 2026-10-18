# Material and design system

## Two styling layers

`UI/zenvork-ui/src/styles/_tokens.scss` contains exact Zenvork CSS custom properties for custom UI:
backgrounds, glass surfaces, shared data-grid surfaces, text, gradients, status colors (including
matching soft/background and border tokens), typography, and radii.

`UI/zenvork-ui/src/styles/_material-theme.scss` defines the Angular Material 3 dark and light themes
and emits Material system variables for the active appearance.

## Material 3 roles

- Primary is Cyan for default Material interactions.
- Tertiary is the custom Zenvork Purple tonal palette; its tone 50 is `#7C4DFF`.
- Error uses Material's accessible red palette.

In dark mode, M3 semantic variables choose accessible tones automatically. For example,
`--mat-sys-tertiary` resolves to a light Purple tone, while
`--mat-sys-tertiary-container` and `--mat-sys-on-tertiary-container` form a darker Purple container
pair.

## Appearance preference

Dark mode is the default. `ThemeService` applies the chosen `dark` or `light` theme on the root HTML
element and stores the preference locally in the browser. Both public and authenticated navigation
offer the same toggle. The light theme overrides the Zenvork surface, text, state, gradient, native
control, dialog-backdrop, and Material semantic tokens; page styles should continue to use tokens rather
than hardcoded dark colors. Deliberately dark product illustrations define a local palette so their text
remains readable in either appearance.

`UI/zenvork-ui/src/app/modules/landing/_preview-tokens.scss` owns that illustration palette. Its Sass
variables are landing-private and apply only to intentionally dark, non-interactive product previews;
application pages continue to use the regular appearance-aware tokens.

## Usage rule

- Use app tokens such as `--purple`, `--surface`, and `--border` for exact Zenvork custom styling.
- Use `--mat-sys-*` variables for semantic, light/dark-theme-aware styling and Material integration.
- Do not use legacy M2 `color="accent"` APIs with M3 components; create an M3 component variant or
  use a semantic system variable instead.

## Native scrollbars

Global styles render thin token-based scrollbars: `--bg` is the track and `--text-mute` is the thumb, with
`--text-dim` on hover. Firefox uses its standard scrollbar properties; Chromium/Safari use the WebKit
scrollbar pseudo-elements. This keeps scrollbars aligned with both application appearances.
