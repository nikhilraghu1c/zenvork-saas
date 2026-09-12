# Shared UI components

Angular Material supplies accessible behavior and interaction primitives. Zenvork shared components
own the application-level visual and usage API.

```text
Angular Material → Zenvork shared wrapper → Page/module
```

Pages should use a shared wrapper when one exists rather than styling raw Material components.

## Growth strategy

Start each wrapper with only the capabilities needed by its first caller. Extend that same wrapper
when a real new requirement appears; avoid speculative props and variants.

Current wrappers are `AppButtonComponent`, `AppCheckboxComponent`, `AppInputComponent`,
`AppSelectComponent`, `AppDataGridComponent`, and `AppActionMenuComponent`. They provide the initial public-form,
action-menu, and desktop data-grid UI while keeping their public APIs intentionally small.
Business-type tiles are registration-specific native radio inputs, so they remain inside that module
rather than being treated as a shared component.

The wrappers live directly in `src/app/shared/button` and `src/app/shared/input`; their Angular
selectors remain `app-button` and `app-input`. `AppCheckboxComponent` lives in
`src/app/shared/checkbox` and uses the `app-checkbox` selector. The authenticated sidebar and
topbar remain layout-owned components because they are specific to `AppLayoutComponent`.

`AppInputComponent` uses Material's floating label by default. Set `floatLabel="always"` to keep
that label floated, or set `labelPlacement="outside"` for an accessible native label above the
outlined field. Provide `inputId` when a stable DOM identifier is needed. Its supported native
input types are `text`, `email`, `password`, and `tel`. Its `subscriptSizing` defaults to `fixed`
for consistent form spacing; use `dynamic` for compact fields such as a search input that does not
show supporting feedback. Fields marked `required` automatically show a visual error-colored star
while retaining the native required attribute for accessibility and validation.

`AppButtonComponent` emits `clicked` for page-level actions such as routed navigation while keeping
the same shared Material button styling. Use `primary` for the main action, `secondary` for neutral
outlined actions such as Cancel, and `tertiary` only for intentional purple emphasis.

`AppActionMenuComponent` provides the icon-only three-dot trigger and menu overlay for record
actions. Pass its `items` array (`id`, `label`, `icon`, optional `disabled`) and handle
`actionSelected` in the feature. The wrapper owns the Material menu and its overlay styling.

`AppDataGridComponent` wraps AG Grid Community for dense desktop data. Features provide their rows
and column definitions; the wrapper owns the shared dark grid theme, default sortable/resizable
columns, accessible cell focus behavior, and auto-height layout. Pair it with a feature-owned card
view only when a compact grid is not practical. Grids intended for mobile should pin their action
column so it remains visible while the remaining columns scroll horizontally.

`AppSelectComponent` (`shared/select`, `app-select`) wraps Material's single-select listbox and
implements ControlValueAccessor for reactive forms. Pass `options` with string `value`, `label`,
and optional `disabled` fields. An empty string is a selectable value for optional choices.
It supports `label`, `labelPlacement` (`floating` or `outside`), `placeholder`, `required`, `hint`,
`errorMessage`, `subscriptSizing`, and a stable `selectId`. Disabled state comes from the form control.
Callers supply validation messages when touched/submitted. Fields match the shared input geometry;
the scoped overlay uses compact menu-like rows and cyan hover/selection while retaining Material's
keyboard navigation and listbox semantics. Feature pages use this wrapper rather than raw selects.
