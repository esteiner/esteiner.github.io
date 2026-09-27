## Context

`ProductFilter.filterProduct` handles text as follows: `parseDrinkingWindowYear(text)` (the regex `/^bis\s*(\d{4})$/i` on the trimmed text) returns a year or `null`. If there is a year, only `endsDrinkingWindowBy` applies. Otherwise the plain OR over name, production date, grape variety, alcohol, country and region applies. `Product.getVolumeMl()` returns the bottle size in millilitres (`km:milliliter`, a number). The unit-test stub `makeBottle` does not yet expose `getVolumeMl`.

## Goals / Non-Goals

**Goals:**
- `ml <size>` finds products with exactly that bottle size, mirroring the shape and behaviour of `bis <year>`.

**Non-Goals:**
- Ranges or comparisons (`ml <1000`), litres (`1.5l`), or suffix forms (`1500ml`).
- Combining a structured query with free text (e.g. `ml1500 Barolo`).
- Matching the bottle size in plain text search.

## Decisions

- **Regex `/^ml\s*(\d+)$/i` on the trimmed text**, in a `parseBottleSizeMl(text): number | null` helper next to `parseDrinkingWindowYear`. Any whole number is accepted, since sizes like 187, 375, 750, 1500, 3000 and 6000 vary in length. Alternative: a fixed list of common sizes. Rejected because the data may hold unusual sizes and the list would need maintenance.
- **Exact equality** (`volumeMl === size`). "The corresponding value" is one size, unlike the drinking window, where "bis" naturally means "up to". Alternative: `<=`, mirroring `bis`. Rejected because `ml750` would then also return half bottles, which is rarely wanted.
- **Structured queries are checked in order**: drinking window first, then bottle size, then plain text. The two patterns can't both match, since they start with `bis` and `ml`, so the order only keeps the code readable. The branch becomes `if (year !== null) … else if (size !== null) … else plainText`.
- **Missing size never matches** a size query. This follows the "missing drinking window never matches" rule.

## Risks / Trade-offs

- [Someone searching for a wine whose name starts with "ml" followed by digits] → Unlikely. Such a query can still be found through other words of the name.
