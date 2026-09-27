## Why

In the inline product editor, the product name is recomputed from Hersteller, Weinname and Jahrgang — but not from Flaschengrösse. Names of ingested products already carry a size suffix for non-standard bottles (e.g. "Strasserhof Kerner 2021 (1.5l)", "Nals Margreid Baronesse passito 2017 (0.375l)"). Editing any of the three fields therefore drops the suffix, and changing the bottle size never updates the name, so a magnum and a standard bottle of the same wine end up indistinguishable by name.

## What Changes

- The derived product name becomes `<Hersteller> <Weinname> <Jahrgang> <Flaschengrösse>`, with empty parts omitted.
- Editing Flaschengrösse in edit mode now also triggers the name recomputation (in addition to Hersteller, Weinname, Jahrgang).
- The bottle size is rendered in the name as a litre suffix in parentheses:
  - 750 ml (standard bottle) → no suffix
  - 1500 ml → `(1.5l)`
  - 3000 ml → `(3l)`
  - 375 ml → `(0.375l)`
  - any other size → `(<litres>l)` in the same style (decimal point, no trailing zeros)
  - no size set → no suffix
- The name is only recomputed when one of the four fields is edited; existing names are not rewritten otherwise.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `product-inline-edit`: the "product name is derived" requirement now includes Flaschengrösse as a fourth part (with the litre-suffix formatting rule), and editing Flaschengrösse triggers the recomputation.

## Impact

- `src/infrastructure/web/components/product-component.ts` — `deriveName()` and the Flaschengrösse input's setter.
- A small pure formatting helper for the size suffix (domain layer, `src/domain/Product/`) with unit tests.
- No data migration, no changes to persistence or sync; existing product names stay as they are until edited.
