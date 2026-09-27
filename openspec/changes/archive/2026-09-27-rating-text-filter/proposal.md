## Why

The text filter has two structured queries: `bis <year>` for the drinking window and `ml <size>` for the bottle size. Ratings (0–3, given when a bottle is moved to Altglass, plus older product-level ratings) can't be searched at all. Finding the wines one rated highest, e.g. to buy them again, means expanding rows one by one.

## What Changes

- The text filter treats `top<N>` (e.g. `top3`, `top 3`, case-insensitive) with N from 1 to 3 as a rating query.
- A rating query matches a product if **any** of its ratings is **exactly** N. This includes ratings stored on its bottles (also bottles already in Altglass) and its legacy product ratings, i.e. `product.getRatings()`. Products without ratings do not match. The other text fields are not searched.
- `top0` and other numbers are not rating queries. They fall back to plain text search.
- Plain text search is unchanged and doesn't consider ratings.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `product-text-filter`: adds the `top<N>` rating query, and states that plain text search also ignores ratings.

## Impact

- `src/domain/Product/ProductFilter.ts`: parse `top<N>` next to `bis <year>` and `ml <size>`.
- `src/domain/Product/ProductFilter.test.ts`: unit tests, and the test stub gains `getRatings`.
- Works on every page that uses `ProductFilter` (search, cellar, cellarwork, order).
