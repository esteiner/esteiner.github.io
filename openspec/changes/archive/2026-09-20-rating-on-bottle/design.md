## Context

Ratings today are structured objects (`SoukaiRating`: `schema:ratingValue` + `schema:dateCreated`) stored **same-document** on the `Product` via a `belongsToMany` relation (`km:hasRating` → `ratingUrls`), resolved through `SoukaiProduct.getRatings()` and rendered by `product-component` ("Bewertungen").

The only write path is `KellermeisterService.disposeBottleToAltglass(bottle, ratingValue)` (cellar-page rating modal, values 0–3). It currently does two saves — `product.createRating(value)` + `productRepository.save(product)` **and** `bottleRepository.save(bottle)` — because disposal already re-homes the bottle. Persisting a rating therefore rewrites the entire (potentially large, multi-rating) product document on every single rating, which is the sync cost we want to remove.

Interesting history: rating *used* to live on the bottle as a bare `schema:rating` number. `SoukaiBottle.schema.ts` still carries that field, kept **read-only** so old Pods remain readable; new bottles never write it. This change deliberately brings the rating back to the bottle — but as a structured, dated rating — while keeping the product array for backward compatibility.

`product-component` receives only a `Product` (from `bottle-component` via `bottle.getProduct()`, or from `order-item-component` via `orderItem.getProduct()`). It never receives the set of a product's bottles. So aggregating bottle ratings on the product view requires the `Product` itself to be able to reach its bottles.

## Goals / Non-Goals

**Goals:**
- Store a single, dated rating on an individual `Bottle`, persisted on the bottle's own RDF resource.
- Persisting a rating writes only the bottle document — never the product document.
- The product detail view shows one combined list: the product's legacy `rating` array **plus** the ratings of the product's bottles.
- Keep the product `rating` array and `Product.createRating()` for backward compatibility; no data migration.

**Non-Goals:**
- Migrating existing product-level ratings onto bottles.
- Changing the 0–3 rating scale or the disposal-to-Altglass entry point as the primary place a rating is captured.
- Reworking the sync/CRDT machinery (this change only shifts which document a rating lands in).

## Decisions

### Decision 1: Change the bottle's `rating` field from a bare number to a structured `Rating`
Repurpose the bottle's existing `rating` field — today `number().rdfProperty("schema:rating")`, kept read-only for old Pods — into a single, same-document `Rating`: a `belongsToOne` relation on `SoukaiBottle` to a `SoukaiRating`, embedded in the bottle document (`.usingSameDocument()`). Expose it in the domain via `Bottle.getRating(): Rating | undefined` and `Bottle.setRating(value: number): void`.

- **Why:** Reuses the existing `SoukaiRating` model and the `Rating` domain interface (`getValue()`/`getDate()`), so the display code and the value+date semantics carry over unchanged. A rating gains a date instead of being a bare number, and same-document embedding means a rating write = one small bottle-document write. Repurposing the existing field (rather than adding a second one) keeps a single "rating on the bottle" concept.
- **RDF/backward-compat note:** A single Soukai field cannot be simultaneously a numeric literal and a nested node, so the structured rating uses a distinct property (e.g. `km:rating` for the `SoukaiRating` node) while the old numeric `schema:rating` value is handled by a read-time fallback (see Risks). Old numeric bottle ratings were already migrated onto the product, so this does not lose data.
- **Alternatives considered:**
  - *Keep the legacy `schema:rating` number field read-only and add a separate new rating field.* Rejected per the decision to change the field's type rather than carry two bottle-rating fields.
  - *Store scalar `ratingValue` + `ratingDate` fields directly on the bottle (no nested node).* Viable and marginally lighter, but does not reuse the `SoukaiRating`/`Rating` abstraction, forcing a parallel rating shape. Kept as a fallback if the nested same-document relation proves awkward with Soukai.

### Decision 2: Add an inverse `Product` → bottles relation, wired in memory, and aggregate ratings on the `Product`
Add an inverse relation on `SoukaiProduct` to its bottles (bottles reference the product through `productUrl` / `schema:subjectOf`). `product-component` keeps calling `product.getRatings()`; redefine that method to return the union of the legacy product `rating` array and the `getRating()` of each of the product's bottles.

**Important implementation constraint (discovered during apply):** products and bottles live in *separate local containers* (`local://products/`, `local://bottles/`). Soukai's relation loading cannot query across containers here — `product.loadRelation("bottles")` finds nothing because `SoukaiBottle.all()` without a container `from` is empty. The existing repository already works around this by fetching products separately and joining `bottle → product` **in memory** (`SoukaiBottleRepository.fetchBottles`). So the `product → bottles` link is wired the same way: `fetchBottles` groups the fetched bottles by product and assigns each product's `relatedBottles.related` in memory (and loads each bottle's same-document `rating`). The `bottles` relation is therefore a marker for the in-memory join, not a query-loaded relation.

- **Why:** This inverse relation is required — without it a `Product` has no way to reach the bottles that now carry the ratings. The display component only holds a `Product`; making the `Product` self-contained keeps the view untouched and puts the merge in one place. The cellar view already loads all bottles (and their products) through `fetchBottles`, so that is the natural place to complete the reverse join.
- **Alternatives considered:**
  - *Load the inverse relation via `loadRelation("bottles")` in the product repository (analogous to `ratings`).* Rejected — it does not work: cross-container relation queries return nothing (verified). `fetchById` is not on any display path, so aggregation only needs to happen where bottles are already loaded.
  - *Aggregate in `KellermeisterService`/the view from already-loaded bottles.* The service caches all bottles, but the component API would have to grow to accept a pre-merged rating list, and the order-item usage of `product-component` has no bottles at all. More plumbing, two code paths.
  - *Leave `getRatings()` as legacy-only and add a separate `getAllRatings()`.* Cleaner separation but requires touching every call site and risks the view showing the wrong (legacy-only) list.

### Decision 3: Switch the disposal write path to the bottle; drop the product save
In `disposeBottleToAltglass`, replace `product.createRating(value)` + `productRepository.save(product)` with `bottle.setRating(value)`. The rating rides along on the bottle save that disposal already performs — eliminating the product write entirely.

- **Why:** This is where the sync win is realized: one bottle write instead of a bottle write **and** a full product-document rewrite.
- **Alternative:** Keep writing to the product too (dual-write). Rejected — it defeats the performance goal and reintroduces the product-document contention.

### Decision 4: Deprecate `Product.createRating()`
Mark `Product.createRating()` (and the corresponding `SoukaiProduct` implementation) as deprecated — retained so existing product `rating` arrays remain readable/writable and no call site breaks, but flagged so no new code adds ratings to the product. New ratings are written via `Bottle.setRating()`.

- **Why:** New rating writes now go to the bottle (Decision 3); keeping `createRating()` callable but deprecated preserves backward compatibility while steering future code to the bottle path.
- **Alternative:** Remove `createRating()` outright. Rejected — it would break backward compatibility and is unnecessary since the goal is only to stop *new* product-level writes.

## Risks / Trade-offs

- **Old numeric `schema:rating` bottle values become unreadable after the type change** → A read-time fallback maps a legacy numeric `schema:rating` to a `Rating` (value = the number, no date). This is low-risk because those old bottle numbers were already migrated onto the product; if the fallback is dropped, no rating data is actually lost.
- **Duplicate display if a rating exists in both places** → For any given bottle a rating is written to exactly one place going forward (the bottle); legacy product ratings pre-date bottle ratings, so there is no double-counting for the same event. No dedup logic is added.
- **Loading bottles per product for display adds reads** → Mitigated by loading the inverse relation only in the read paths that feed the views showing ratings, mirroring the existing `loadRelation("ratings")` usage; the cellar view already has these bottles in play.
- **Soukai same-document `belongsToOne` on the bottle behaving differently than the product's `belongsToMany`** → Fallback is Decision 1's scalar-fields alternative; validate persistence + reload of a bottle rating early.
- **Sync remapping of the nested rating node on re-home** → The product's same-document ratings already migrate via `MigrateLocalUrls`; ensure the bottle's nested rating node is covered by the same mechanism.

## Migration Plan

No data migration. Both representations coexist: existing product `rating` arrays stay on product documents and remain readable/writable via `Product.createRating()`; new ratings are written to bottles. Rollback is safe — reverting the code leaves already-written bottle ratings in place (readable via the retained bottle rating field) and the product array untouched.

## Open Questions

- Should a bottle's rating be settable independently of disposal-to-Altglass (a standalone "rate this bottle" action), or is disposal the only capture point for now? Current scope assumes disposal remains the primary path.
- Is the read-time fallback for legacy numeric `schema:rating` bottle values worth keeping, or can it be dropped given those values already exist as product ratings?
