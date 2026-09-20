## 1. Application layer

- [x] 1.1 In `KellermeisterService.bottlesFromCellarGroupedByProduct`, change the grouping key from `bottle.getProduct().getName()` to `bottle.getProduct().getId()`.
- [x] 1.2 Change the final sort so entries are ordered by each group's product **name** (case-insensitive, via `group[0].getProduct().getName()`) rather than by the map key — keeping the alphabetical layout and same-name groups adjacent.
- [x] 1.3 Confirm filtering (`filter.filterProduct`) and cellar membership (`isBottleInThisCellar`) remain applied per bottle before grouping.

## 2. Web / display

- [x] 2.1 Verify `cellar-page.ts` still renders correctly: it consumes only the map's `.values()`, rendering one row per group with `group[0]`'s product and `group.length` as the count — no template change needed.

## 3. Verification

- [x] 3.1 Add/adjust a unit test for `bottlesFromCellarGroupedByProduct`: two products with the **same name but different ids** yield **two** groups with correct per-group counts; multiple bottles of one id yield a single group; ordering is by name.
- [x] 3.2 Manually verify in the running app: a cellar with two same-named products (from different orders) shows two rows, each with its own count and its own product detail (price/source/ratings).
