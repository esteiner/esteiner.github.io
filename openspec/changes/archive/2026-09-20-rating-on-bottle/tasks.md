## 1. Domain layer

- [x] 1.1 Add `getRating(): Rating | undefined` and `setRating(value: number): void` to the `Bottle` interface (`src/domain/Bottle/Bottle.ts`).
- [x] 1.2 Keep `Product.getRatings(): Rating[]` as the single display accessor and mark `Product.createRating(value)` as deprecated (`src/domain/Product/Product.ts`) — retained for backward compatibility, no interface signature change.

## 2. Persistence layer (Soukai / RDF)

- [x] 2.1 Change the bottle `rating` field in `SoukaiBottle.schema.ts` from `number().rdfProperty("schema:rating")` to a single same-document `Rating`: a `belongsToOne` to `SoukaiRating` via a `km:rating` property, using `.usingSameDocument()` (mirroring `SoukaiProduct`'s ratings relation).
- [x] 2.2 Implement `getRating()` and `setRating(value)` on `SoukaiBottle.ts` (create a `SoukaiRating` with value + current date, wire via `relatedRating.setRelated(...)`); return `undefined` when no rating is set. Include a read-time fallback that surfaces a legacy numeric `schema:rating` as a `Rating` (value = the number, no date).
- [x] 2.3 In `SoukaiProduct`, add an inverse relation to its bottles (bottles reference the product through `productUrl` / `schema:subjectOf`) so a product can reach its bottles.
- [x] 2.6 Mark the `SoukaiProduct.createRating(value)` implementation as deprecated (kept working) to match the domain deprecation.
- [x] 2.4 Change `SoukaiProduct.getRatings()` to return the union of the legacy product `rating` array and the ratings of the product's loaded bottles.
- [x] 2.5 Wire the `product → bottles` link (and load each bottle's same-document `rating`) **in memory** in `SoukaiBottleRepository.fetchBottles` — the cellar-view read path — because cross-container relation queries return nothing. (`loadRelation("bottles")` in the product repo does not work; `fetchById` is not a display path.)
- [x] 2.7 Add an integration test (`DisposeBottleRating.test.ts`) with real Soukai repositories: `disposeBottleToAltglass` stores the rating value on the bottle, survives reload, and surfaces through `product.getRatings()` on the cellar-view path.

## 3. Application layer

- [x] 3.1 In `KellermeisterService.disposeBottleToAltglass`, replace `bottle.getProduct().createRating(value)` + `productRepository.save(product)` with `bottle.setRating(value)`, so only the bottle is saved.
- [x] 3.2 Verify no other call site depends on the removed product save; confirm `cachedBottles` invalidation still occurs.

## 4. Web / display

- [x] 4.1 Verify `product-component.renderRatings()` shows the combined list unchanged (it calls `product.getRatings()`, which now aggregates bottle + legacy ratings) in both the bottle-component and order-item-component contexts.
- [x] 4.2 Confirm the cellar-page rating modal (0–3) still drives `disposeBottleToAltglass` and the rating appears in the product view after disposal.

## 5. Sync & verification

- [x] 5.1 Verify the bottle's nested same-document rating node is remapped on re-home to the Pod (covered by `MigrateLocalUrls`, as the product ratings are).
- [x] 5.2 Manually verify: setting a rating writes only the bottle document (product document unchanged); a product with legacy ratings + rated bottles shows both in one list; an unrated product/bottle shows an empty list with no error.
- [x] 5.3 Verify old-Pod backward compatibility: existing product `rating` arrays still read and display; legacy bottle `schema:rating` numbers remain readable.
