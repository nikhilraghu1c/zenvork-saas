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

Current wrappers are `AppButtonComponent`, `AppCheckboxComponent`, and `AppInputComponent`. They
provide the initial public-form UI while keeping their public APIs intentionally small.
Business-type tiles are registration-specific native radio inputs, so they remain inside that module
rather than being treated as a shared component.

The wrappers live directly in `src/app/shared/button` and `src/app/shared/input`; their Angular
selectors remain `app-button` and `app-input`. `AppCheckboxComponent` lives in
`src/app/shared/checkbox` and uses the `app-checkbox` selector. The authenticated sidebar and
topbar remain layout-owned components because they are specific to `AppLayoutComponent`.

`AppInputComponent` uses Material's floating label by default. Set `floatLabel="always"` to keep
that label floated, or set `labelPlacement="outside"` for an accessible native label above the
outlined field. Provide `inputId` when a stable DOM identifier is needed. Its supported native
input types are `text`, `email`, `password`, and `tel`.
