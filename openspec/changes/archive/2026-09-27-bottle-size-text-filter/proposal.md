## Why

The text filter already understands one structured query, `bis <year>`, which filters by the end of the drinking window. There is no way to find bottles of a certain size, e.g. all magnums, even though every product stores its bottle size (Flaschengrösse, `km:milliliter`). In the seed data, 11 of the 259 products are 1500 ml and 1 is 375 ml.

## What Changes

- The text filter treats an entered text of the form `ml <size>` (e.g. `ml1500`, `ml 1500`, case-insensitive) as a bottle-size query.
- A bottle-size query matches a product only if its Flaschengrösse equals the entered number of millilitres. Products without a bottle size do not match. The other text fields are not searched, just as with `bis <year>`.
- Plain text search is unchanged. A bare number like `1500` still does not match by bottle size.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `product-text-filter`: adds the `ml <size>` bottle-size query, and states that plain text search ignores the bottle size as well as the drinking window.

## Impact

- `src/domain/Product/ProductFilter.ts`: parse `ml <size>` next to `bis <year>` in the text branch.
- `src/domain/Product/ProductFilter.test.ts`: unit tests, and the test stub gains `getVolumeMl`.
- Like `bis <year>`, it works on every page that uses `ProductFilter`: search, cellar, cellarwork and order.
