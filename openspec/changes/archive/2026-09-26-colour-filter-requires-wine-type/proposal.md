## Why

The colour filters (Weiss, Rot, Rosé) only checked `weinfarbe`. Sparkling wines also carry a colour (in the seed data 160 `Schaumwein` are `weiss`, 14 `rose` and 1 `rot`), so "Weiss" returned mostly sparkling wines, and the still whites were buried among them. A colour filter without the Sprudel filter should mean the still wine of that colour.

## What Changes

- If a colour filter is active and the Sprudel filter is not, the product must also have the matching Weinart: Weiss → `Weisswein`, Rot → `Rotwein`, Rosé → `Rosewein`. Sprudel + a colour filter keeps its current meaning (sparkling wine of that colour).
- New `Weinart` values `Rotwein`, `Weisswein` and `Rosewein`, matching the values stored in `km:weinart`.
- The Weinart requirement for colours applies only when **no** Weinart filter is active (neither Sprudel nor Dessert). Without this guard, Dessert + a colour would demand `Dessertwein` and `Weisswein` at the same time and never match. The Dessert filter has no UI button but can be set through the `dessert` URL parameter.
- Remove the commented-out block in `filterProduct`.
- **BREAKING** (behavioural): a product whose Weinart is the generic `Wein`, or `Dessertwein`, no longer matches a colour filter on its own. The seed data has no `Wein` products and 1 `Dessertwein`.

The core rule is already implemented in the working tree (`ProductFilter.ts`, `Weinart.ts`). This change documents it, adds the Dessert guard and cleanup, and covers it with tests.

## Capabilities

### New Capabilities
- `wine-type-colour-filter`: How the Weinart filters (Sprudel, Dessert) and the colour filters (Weiss, Rot, Rosé) combine when filtering products.

### Modified Capabilities
<!-- none -->

## Impact

- `src/domain/Product/ProductFilter.ts`: colour branch and cleanup.
- `src/domain/Product/Weinart.ts`: three new values (already added).
- `src/domain/Product/ProductFilter.test.ts`: new tests for the rule.
- The rule applies wherever `ProductFilter` is used: the search, cellar, cellarwork and order pages.
