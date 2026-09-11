## Context

The details dialog's Preis/Währung row lives entirely in `kellermeister-footer.ts` (`renderDetailsDialog()` markup + `dialogStyles()`). `.dialog-field-inline .details-currency-field` currently has `flex: 0 0 110px` — a fixed, non-shrinking width. The dialog itself is `width: min(440px, 92vw)` with `28px` horizontal padding, so on phones around 360-390px wide the remaining row width (~289-303px) is tight once the Preis field's own minimum content width is accounted for, and the fixed 110px currency column pushes the row past the dialog's padded edge. See proposal.md - Why.

## Goals / Non-Goals

**Goals:**
- Currency input stays inside the dialog on small mobile viewports (~360px+) without changing the dialog's overall width or breakpoint behavior.
- Currency input shows "CHF" as a placeholder hint, not a pre-filled value.

**Non-Goals:**
- Reworking the dialog's general layout, styling system, or the Anzahl row.
- Adding currency validation, formatting, or a currency picker/dropdown.
- Changing what gets submitted to the conversion service (still free-text `priceCurrency`, omitted when empty).

## Decisions

- **Shrink the fixed column instead of restructuring the row.** Change `.details-currency-field` from `flex: 0 0 110px` to a smaller basis (e.g. `flex: 0 1 72px` with a small `min-width`) so it both starts narrower (fitting "CHF"-length input) and can shrink further under `flex-shrink: 1` if the viewport is exceptionally narrow, rather than a rigid `0 0` that never yields. Alternative considered: switch the row to CSS grid with `minmax()` — rejected as a bigger structural change for no added benefit here, since the existing flex layout already does the job once the fixed basis is corrected.
- **Placeholder, not a default value.** Use the native `placeholder="CHF"` attribute on the `<input>` rather than setting `value="CHF"`, so an unedited field still reads as empty text and is omitted from the submitted payload per the existing "Empty inputs SHALL be permitted" rule — consistent with how `details-price` and `details-place` behave today.

## Risks / Trade-offs

- [A currency longer than "CHF" (e.g. a hypothetical 4+ char code) could still feel cramped at 72px] → Acceptable: the app is Swiss-focused (CHF) and the field remains free text and horizontally scrollable within the input itself; not a regression versus today's overflow bug.
