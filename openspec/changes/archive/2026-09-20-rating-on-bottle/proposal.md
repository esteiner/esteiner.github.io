## Why

Ratings are currently stored as an array on the `Product` aggregate. Adding or changing a single rating rewrites the whole product RDF resource, which makes Pod synchronization slower and more conflict-prone (concurrent ratings on the same product collide on one document). Because bottles are the natural unit a person actually tastes and rates, moving a rating onto its bottle lets each rating live in a small, independently-syncable resource while the product view keeps showing the full list of ratings.

## What Changes

- Change the `Bottle`'s existing `rating` field from a bare `number` to a structured `Rating` (value + date) stored on the bottle's own RDF resource.
- Add an inverse `Product` → bottles relationship so a product can reach the ratings now stored on its bottles.
- Keep the existing `rating` array on `Product` for backward compatibility, and **deprecate** `Product.createRating()` (retained so existing data still reads/writes, but no new code should add ratings to the product).
- On the product detail view, display the combined list of ratings drawn from **both** sources: the product's own legacy `rating` array **and** the ratings stored on the product's bottles.
- Provide a way to set/read a rating on an individual bottle in the UI where bottles are shown.
- No migration of existing product-level ratings; both representations coexist. (Not marked BREAKING — both properties are retained.)

## Capabilities

### New Capabilities
- `bottle-rating`: A rating can be stored on an individual bottle, and the product detail view aggregates ratings from bottles together with the product's legacy rating list into a single displayed list.

### Modified Capabilities
<!-- No existing spec captures product/bottle rating behavior today; this is introduced as a new capability. -->

## Impact

- **Domain** (`src/domain/`): `Bottle` rating becomes a `Rating` (via `getRating()`/`setRating()`); `Product` keeps its `rating` array and `createRating()` is deprecated.
- **Infrastructure** (`src/infrastructure/solid/`): Soukai/Solid model for `Bottle` (rating field changed to a same-document `Rating` node) and `Product` (new inverse relation to bottles) — used to gather bottle ratings.
- **Web** (`src/infrastructure/web/`): product detail view merges bottle ratings with the legacy product ratings for display; a bottle view/component allows setting a bottle's rating.
- **Application** (`src/application/`): `KellermeisterService` use case(s) for setting a bottle rating and for resolving the aggregated rating list.
- **Pod synchronization**: ratings become small per-bottle resource writes instead of full product-resource rewrites; no data migration required.
