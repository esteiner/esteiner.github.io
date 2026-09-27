## Why

In the cellar's inline product edit mode, "Preis / Flasche" offers only a number input for the price. The currency (`priceCurrency`, e.g. "CHF") is shown next to the price in read-only mode, but it can't be changed. A missing or wrong currency from an order (or from a photo capture without a currency) stays wrong for good.

## What Changes

- In edit mode, the "Preis / Flasche" row shows two inputs on one line: a number input for the price and a narrower text input for the currency. They follow the existing two-input layout of "Trinkfenster".
- The currency input writes through to the product and is persisted like every other edited field. The read-only price row shows the new currency right after leaving edit mode.
- Add `setPriceCurrency(currency)` to the `Product` domain interface and to `SoukaiProduct`.
- An empty currency input clears the currency.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `product-inline-edit`: the list of editable attributes includes the currency (Währung), edited on the same line as Preis.

## Impact

- `src/domain/Product/Product.ts` and `src/infrastructure/soukai/model/SoukaiProduct.ts`: new setter.
- `src/infrastructure/web/components/product-component.ts`: price row in edit mode, and a style for the currency input width.
- `e2e/specs/edit-product.spec.ts`: extend the price test to edit the currency as well.
- No schema change: `priceCurrency` (`schema:priceCurrency`) already exists on the product.
