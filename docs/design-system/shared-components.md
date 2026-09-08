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

The first planned wrappers are `AppButtonComponent` and `AppInputComponent`. They will support the
business registration flow before additional component APIs are introduced.
