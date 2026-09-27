## Context

`ProductFilter.filterProduct` checks two structured queries on the trimmed text: `bis <year>` (`parseDrinkingWindowYear`) and `ml <size>` (`parseBottleSizeMl`). Otherwise it falls back to plain text search. `Product.getRatings()` returns the legacy product ratings together with the ratings of the product's bottles. The repository joins bottles to products in memory, so a bottle rated on disposal to Altglass contributes to the ratings of the same product in any cellar. Ratings are `Rating` objects with `getValue(): number` (0–3).

## Goals / Non-Goals

**Goals:**
- `top1`–`top3` find products that have at least one rating of exactly that value.

**Non-Goals:**
- "N or better" semantics. The user chose exact matching.
- Averages or the latest rating as the deciding value.
- `top0` (rated 0). It isn't asked for, and "top" reads oddly with 0.
- Combining with free text.

## Decisions

- **Regex `/^top\s*([1-3])$/i`** on the trimmed text, in a `parseRatingQuery(text): number | null` helper next to the other two parsers. Limiting N to 1–3 makes `top0`/`top4` plain text, as the spec requires.
- **"Any rating equals N"**: `(product.getRatings() ?? []).some(r => r.getValue() === n)`. Alternative: the average or the latest rating. Rejected because the request is "bottles with a rating of 3", and a product that was rated 3 once qualifies, even if another bottle got a 1.
- **Branch order**: drinking window, then bottle size, then rating, then plain text. The prefixes `bis`, `ml` and `top` are disjoint, so the order only affects readability.
- **The test stub gains `getRatings`**, returning `{getValue: () => v}` objects. The existing stub has no ratings, and the filter must treat that as "no ratings" (`?? []`).

## Risks / Trade-offs

- [Search results for ratings depend on the repository having joined bottles to products] → `fetchBottles` already does this for the product detail view (bottle-rating spec). On the order page, products come from orders, whose bottles may not be joined. There, only legacy product ratings count. This is acceptable, and noted here.
