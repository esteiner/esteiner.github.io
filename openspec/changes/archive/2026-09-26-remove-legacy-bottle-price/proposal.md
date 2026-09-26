## Why

The price was moved from the bottle to the product in commit `af2710f` ("Preis auf Product anstatt Bottle."). The bottle still carries a legacy `price`/`priceCurrency`, kept so old pods stay readable, and `SoukaiBottle.getPrice()` falls back to it whenever the product has no price. Nothing writes the bottle price anymore, and the local seed pod has no bottle with a price (0 of 862), while all products have one (243 of 243). The fallback only adds a second source for the price. It also causes a bug: a product price of `0` is falsy, so the legacy bottle price is shown instead.

## What Changes

- **BREAKING** (internal API): remove `getPrice()` / `getPriceCurrency()` from the `Bottle` domain interface and from `SoukaiBottle`. The price is read only from the product (`bottle.getProduct().getPrice()` / `getPriceCurrency()`).
- **BREAKING** (data): remove the legacy `price` / `priceCurrency` fields (`schema:price`, `schema:priceCurrency`) from `SoukaiBottle.schema.ts`. A bottle document that still contains these triples is no longer read for them.
- `bottle-component` renders the product price.
- As a consequence, a product price of `0` is shown as `0`.

## Capabilities

### New Capabilities
- `product-price`: The price of a bottle is the price of its product. There is no per-bottle price.

### Modified Capabilities
<!-- none -->

## Impact

- `src/domain/Bottle/Bottle.ts`: interface loses two getters.
- `src/infrastructure/soukai/model/SoukaiBottle.ts`, `SoukaiBottle.schema.ts`: getters and legacy fields removed.
- `src/infrastructure/web/components/bottle-component.ts`: reads the price from the product.
- Pod data: bottles written before `af2710f` that still have `schema:price` lose that value in the UI. Before implementing, check the real Pod(s) (see tasks).
- Depends on `fix-stale-edited-price` (already implemented, not yet archived), which made `bottle-component` the single place that renders the price.
