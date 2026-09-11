## 1. Currency field layout fix

- [x] 1.1 In `kellermeister-footer.ts`'s `dialogStyles()`, change `.km-source-dialog .dialog-field-inline .details-currency-field` from `flex: 0 0 110px` to a narrower, shrinkable basis (e.g. `flex: 0 1 72px` with a small `min-width`); verify by inspecting the dialog at a 360px-wide viewport (browser devtools device toolbar) and confirming the Preis + Währung row stays fully inside the white dialog panel with no clipping or overflow into the overlay.
- [x] 1.2 Add `placeholder="CHF"` to the `.details-price-currency` input in `renderDetailsDialog()`; verify the placeholder is visible when the field is empty and that leaving it untouched still sends `priceCurrency` as omitted/empty (per the existing `read()` behavior in `handleDetailsSend`).

## 2. Verification

- [x] 2.1 Run `npm run build` and confirm it completes without type or build errors.
- [x] 2.2 Manually exercise the "Flasche hinzufügen" flow (camera or file source) through to the details dialog on a narrow mobile viewport and confirm: the Preis and Währung inputs are both fully visible side by side, the Währung field shows "CHF" as placeholder text, and Senden still works with the field left empty.
