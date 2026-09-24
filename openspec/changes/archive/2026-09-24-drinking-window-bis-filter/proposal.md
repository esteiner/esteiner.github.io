## Why

The text filter on the search page always applies a drinking-window comparison (`drinkingWindowTo <= Number(text)`) as an extra OR branch. Entering a bare number such as a vintage (`2019`) or an alcohol value therefore also matches every bottle whose drinking window ends by that year, which makes plain text searches return unexpected results. Drinking-window search should be an explicit, opt-in query.

## What Changes

- The text filter only compares against `drinkingWindowTo` when the entered text has the form `bis <year>` (e.g. `bis 2025`, case-insensitive, 4-digit year).
- For a `bis <year>` query, a product matches when its drinking window ends in or before that year (`drinkingWindowTo.getFullYear() <= year`). Products without a `drinkingWindowTo` do not match. The other text fields are not searched for this query.
- For any other text, only the regular text fields (name, production date, grape variety, alcohol content, country, region) are searched; `drinkingWindowTo` is ignored. **BREAKING** (behavioural): entering a bare year like `2025` no longer matches by drinking window.
- Remove the debug `console.log` in the drinking-window comparison.

## Capabilities

### New Capabilities
- `product-text-filter`: Text filtering of products on the search page (and other pages sharing `ProductFilter`), including the explicit `bis <year>` drinking-window query.

### Modified Capabilities
<!-- none -->

## Impact

- `src/domain/Product/ProductFilter.ts` — `filterProduct` text branch and `isBiggerThan` helper.
- `src/domain/Product/ProductFilter.test.ts` — drinking-window tests updated to use `bis <year>`; new tests for the non-`bis` case.
- `ProductFilter` is shared, so the cellar, cellarwork and order pages get the same text-filter behaviour as the search page. No UI, URL parameter or data model changes.
