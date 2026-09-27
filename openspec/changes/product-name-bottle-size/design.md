## Context

`product-component.ts` has a private `deriveName()` that builds the product name from `getProducer()`, `getWineName()` and the `getProductionDate()` year. The Hersteller, Weinname and Jahrgang inputs call it after their setters. The Flaschengrösse input (`numberInput` bound to `setVolumeMl`) does not. The volume is stored as `volumeMl` (number, ml). Ingested product names already use a `(1.5l)` / `(0.375l)` suffix for non-standard bottles, so the edited name has to follow the same convention.

## Goals / Non-Goals

**Goals:**
- Include a bottle-size suffix in the derived name, following the rules in the delta spec (750 → none; otherwise `(<litres>l)`).
- Recompute the name when Flaschengrösse is edited.
- Keep the formatting logic pure and unit-testable, outside the Lit component.

**Non-Goals:**
- Rewriting names of existing products that are not edited (no migration).
- Changing how the Flaschengrösse value itself is displayed in the detail row (`1500 ml` stays).
- Changing name derivation during order ingestion.
- Handling a cleared Flaschengrösse input: `numberInput` ignores empty input today, and that stays unchanged.

## Decisions

**1. Pure helpers in the domain layer.** Add `src/domain/Product/ProductName.ts` exporting:
- `bottleSizeSuffix(volumeMl: number | undefined): string | undefined`, which returns `undefined` for missing, non-finite, ≤ 0 or 750 ml, and `` `(${volumeMl / 1000}l)` `` otherwise.
- `composeProductName(producer, wineName, year, volumeMl): string`, which filters out empty parts and joins them with single spaces.

`deriveName()` then becomes a one-liner that calls `composeProductName`. *Alternative:* keep everything inline in the component. That was rejected because the component has no unit tests, and the formatting rule is exactly what needs testing. The helpers sit next to `ProductFilter`/`Weinart`, the existing pure product helpers.

**2. Litre formatting via `String(ml / 1000)`.** JS number-to-string already yields `1.5`, `3`, `0.375`, `0.5`, `6`, `1.75`, with a decimal point and no trailing zeros, which matches the ingested names. *Alternative:* `toLocaleString('de-CH')`. That was rejected because it is locale-dependent and could produce `1,5`, which is inconsistent with the existing data. *Alternative:* a lookup table covering only 375/1500/3000. That was rejected because other formats (500 ml, 6000 ml) would then silently get no suffix. The general rule reproduces all three required examples.

**3. Only 750 ml is suppressed.** 750 is the standard bottle, and it is also the value a size-less wine defaults to in practice. No other size is special-cased.

**4. Wire Flaschengrösse into the existing flow.** Change the Flaschengrösse setter to `(v) => { p?.setVolumeMl(v); this.deriveName(); }`, mirroring the other three fields. `writeThrough` already dispatches `product-changed`, so the header re-renders and `@change` persists. No new events or persistence paths are needed.

## Risks / Trade-offs

- [Per-keystroke recomputation: typing "1500" briefly yields names ending "(0.001l)", "(0.015l)", "(0.15l)"] → The final value is correct and persistence only happens on `change`. This matches how Jahrgang already behaves while typing, so it is acceptable.
- [Hand-curated names (e.g. a "Champagne" prefix not present in Hersteller) are overwritten on edit] → This is existing behaviour for the other three fields and unchanged in scope. The suffix itself now survives edits, which fixes the current data-loss case.
- [Floating-point output for odd volumes (e.g. 187.5 ml)] → `187.5 / 1000` gives `0.1875`, which is exact enough. Integer ml inputs always yield clean decimals.
