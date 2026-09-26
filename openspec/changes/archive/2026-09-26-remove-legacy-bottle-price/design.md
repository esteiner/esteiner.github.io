## Context

`Bottle` exposes `getPrice()` / `getPriceCurrency()`. `SoukaiBottle` implements them as "product price if truthy, else the legacy bottle `price`". The legacy fields stay in `SoukaiBottle.schema.ts` only for pods written before `af2710f`. Since `fix-stale-edited-price`, the only caller is `bottle-component`. `SoukaiBottle` is the only `Bottle` implementation, and the unit-test stubs of `Bottle` don't provide the price getters.

## Goals / Non-Goals

**Goals:**
- One source for the price: the product.
- Remove the legacy fields and the fallback code.

**Non-Goals:**
- An automatic data migration that copies bottle prices onto products.
- Removing other legacy bottle fields (e.g. `legacyRating`).
- Changing how the product price is written (order ingestion, inline edit).

## Decisions

- **Remove the getters from `Bottle`** instead of turning them into pure delegates to the product. Alternative: keep `bottle.getPrice()` as `return this.getProduct().getPrice()`. Rejected because the bottle would still look like it owns a price, and the only caller can just as easily read `bottle.getProduct()`.
- **Remove the schema fields.** `SoukaiBottle` then no longer maps `schema:price` / `schema:priceCurrency` on bottle documents. Alternative: keep the fields declared but unused. Rejected because it is dead schema, and the comment invites someone to re-introduce the fallback.
- **No migration code.** The local seed contains no bottle with a price, and every product carries its price from order ingestion (`SoukaiProductFactory`). A one-off check of the real Pod(s) comes first (task 1.1). If affected bottles are found there, stop and add a migration task before removing the fields.

## Risks / Trade-offs

- [A real Pod still has bottles with `schema:price` whose product has no price] → Those bottles would show no price. Mitigation: task 1.1 checks the Pod before implementing. Such a product can also be fixed by hand with inline price editing.
- [Removed fields: soukai might drop unknown triples when an old bottle document is saved again] → Acceptable, because the value is no longer used.
- [Local IndexedDB copies may still hold legacy bottle prices] → Same as the Pod: they are ignored, and a later sync replaces them.
