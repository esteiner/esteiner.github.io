## Why

In the "Flasche hinzufügen" details dialog, the Währung (currency) field next to Preis is fixed at 110px wide. On narrow mobile screens that pushes the input past the dialog's edge, so it visually overflows the dialog and is unusable (see `notes/ui/bugs/flasche-hinzufuegen_waerungsfeld-zu-lange.png`). The field is also empty by default, giving the user no hint of which currency to enter.

## What Changes

- Narrow the Währung input (and let it shrink further if needed) so the Preis/Währung row always fits inside the dialog's content width, including on small mobile viewports.
- Add a `CHF` placeholder to the Währung input so the expected currency is suggested without pre-filling a value that would be submitted unintentionally.

## Capabilities

### Modified Capabilities
- `photo-order-capture`: the details dialog's currency input must stay within the dialog's bounds on narrow/mobile viewports, and must show "CHF" as a placeholder hint.

## Impact

- `src/infrastructure/web/components/kellermeister-footer.ts`: `renderDetailsDialog()` markup (currency `<input>`) and `dialogStyles()` (`.details-currency-field` width rule).
