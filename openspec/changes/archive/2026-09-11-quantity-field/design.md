## Context

The details dialog (`renderDetailsDialog()` in `kellermeister-footer.ts`) has two rows: Ort (place), and a Preis + Währung row. `handleDetailsSend` reads them into `{place, price, priceCurrency}` (price via `valueAsNumber` + `Number.isInteger`). `OrderConversionDetails` is `{place?: string; price?: number; priceCurrency?: string}`; `HttpOrderConversionService` copies each into the body when present. OpenAPI documents `place`/`price`/`priceCurrency`.

This change adds a third row — **Anzahl** (integer) → `quantity` — following the exact pattern of the integer `price`.

## Goals / Non-Goals

**Goals:**
- Third dialog row: "Anzahl" label + integer input, optional.
- Send `quantity` as an integer number when entered; omit otherwise.
- Add `quantity` (integer) to the OpenAPI contract.

**Non-Goals:**
- No use of `quantity` in local ingestion (the conversion service consumes it); no change to the mock's fixed output.
- No coupling to the existing per-item quantities in the returned Turtle.

## Decisions

### Decision 1: Mirror the integer-price pattern

The Anzahl input is `<input type="number" inputmode="numeric" min="0" step="1" class="dialog-input details-quantity">` in its own `.dialog-field` (label "Anzahl"), placed as the third row after the Preis/Währung row. On Senden, read `valueAsNumber` and include `quantity` only when `Number.isInteger`. `OrderConversionDetails.quantity?: number`; `HttpOrderConversionService` adds `quantity` to the body when `typeof === 'number'`; `MockOrderConversionService` ignores it. OpenAPI: add `quantity: {type: integer}`.

- **Why:** identical to `price`, so it's consistent and low-risk; the read/validate/omit logic is already proven.

## Risks / Trade-offs

- **Builds on the open `price-unit-field` change** → Both MODIFY the same two requirements. This change's deltas are written on top of `price-unit-field`'s version, so they must be archived in order (`price-unit-field` first). Flagged in the proposal.

## Migration Plan

Additive: one optional integer field/property. Revert by removing the Anzahl row and the `quantity` property.
