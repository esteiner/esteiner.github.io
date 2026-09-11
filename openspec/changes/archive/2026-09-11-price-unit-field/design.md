## Context

The details dialog (`renderDetailsDialog()` in `kellermeister-footer.ts`) currently has two stacked `.dialog-field`s (place, price), both plain text inputs read from the DOM on Senden into `{place, price}` (both strings, omitted when blank). `OrderConversionDetails` is `{place?: string; price?: string}`; `HttpOrderConversionService` copies each into the JSON body when truthy. The OpenAPI request schema has `place`/`price` as strings.

This change: put a **price unit** input on the price line, make **price integer-only** and numeric in the request, and add `priceCurrency`.

## Goals / Non-Goals

**Goals:**
- Price line = Preis (integer) + Einheit (free text) side by side.
- Send `price` as an integer number, `priceCurrency` as a string; each omitted when empty.
- Update the OpenAPI contract accordingly.

**Non-Goals:**
- No currency validation/enumeration for the unit (free text).
- No change to capture, ingestion, or the mock's fixed output.

## Decisions

### Decision 1: Integer-only price via `<input type="number">`

The Preis input becomes `<input type="number" inputmode="numeric" min="0" step="1">`. On Senden, read `valueAsNumber` (or parse the value); include `price` only when it is a finite integer. Non-integer/empty → omitted. Using a number input gives native mobile numeric keypads and blocks most non-numeric entry; the read step enforces integer-ness defensively.

- **Alternative — text input + regex** rejected: a number input is simpler and gives the right keyboard.

### Decision 2: Price + unit share one row

Wrap the price and price-unit inputs in a single `.dialog-field` whose control area is a flex row (`.dialog-field-inline`): the integer price grows to fill, the unit is a narrower text input beside it. Keeps the existing label styling; only the price row changes.

### Decision 3: Types and request shape

`OrderConversionDetails` becomes `{place?: string; price?: number; priceCurrency?: string}`. `HttpOrderConversionService` adds `place`/`priceCurrency` to the body when non-empty strings and `price` when it is a number (`typeof === 'number'`), so a blank price is omitted and the `{front, back}`-only shape is preserved when nothing is entered. `MockOrderConversionService` continues to ignore details. OpenAPI: `price` → `type: integer`, add `priceCurrency: {type: string}`.

## Risks / Trade-offs

- **Existing conversion backend may expect `price` as a string** → The user asked to update the conversion service too; `price` is now an integer number by decision. The mock is unaffected; the real endpoint contract is documented in the OpenAPI file.
- **`type=number` still allows `e`/`+`/`-` in some browsers** → The Senden read validates integer-ness (`Number.isInteger`) and `min=0`, so stray values are dropped rather than sent.

## Migration Plan

Additive, small contract change. `price` type changes string→integer (per decision) and `priceCurrency` is new-optional. Revert by restoring the string price and removing the unit field/property.
