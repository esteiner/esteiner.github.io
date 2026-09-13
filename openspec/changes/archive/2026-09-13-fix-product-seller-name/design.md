## Context

`product-component` shows "Quelle" via `product.getOrderItem()?.getOrder()?.getSeller()?.getName()`. The relations exist in the schema:

- `SoukaiProduct.orderItem` — `belongsToOne(SoukaiOrderItem, "orderItemUrl")`, RDF `km:orderItem` (cross-document: the product is its own resource; the order item lives in the order document).
- `SoukaiOrderItem.order` — `belongsToOne(SoukaiOrder, "orderUrl").usingSameDocument()`, RDF `km:order`.
- `SoukaiOrder.seller` — `belongsToOne(SoukaiSeller, "sellerUrl").usingSameDocument()`.

Ingestion (`KellermeisterService.addBottles`): builds `newOrder`, and per item builds `newOrderItem` (sets `relatedOrder`), then `createProduct(sourceProduct, newOrderItem)` which sets `newProduct.relatedOrderItem = newOrderItem`, then **saves the product**, then `linkProduct`. The order is saved last via `saveProcessedOrder` (mints `local://orders/<uuid>` and embeds items with hashes). So when the product is saved, `newOrderItem` has **no final URL** yet → the product's `orderItemUrl` is empty/stale.

Reads never load the product's `orderItem` relation: `SoukaiBottleRepository.fetchBottles` resolves `bottle → product` only; `SoukaiOrderRepository.fetchOrders` loads `order → seller/customer/positions` and `item → product` (forward), not the product's reverse `orderItem`.

## Goals / Non-Goals

**Goals:**
- Persist a **stable** product → order-item link (`km:orderItem` = the order item's final URL).
- Load product → orderItem → order → seller on read for the cellar and order views.
- Keep the link valid after sync/re-homing.

**Non-Goals:**
- No change to what other product fields show; no new UI beyond fixing "Quelle".
- No redesign of the order/embedding model.

## Decisions

### Decision 1: Establish the product → order-item link after the order has a stable URL

Order the persistence so the order item's final URL exists before the product records it. Two viable shapes:
- **(a)** Save the order first (so items get their `local://orders/<uuid>#<hash>` URLs), then create/save each product with `orderItemUrl` set to the item's URL; or
- **(b)** Keep current order, but after `saveProcessedOrder` mints the order, set each saved product's `orderItemUrl` to the corresponding item URL and re-save the product.

Prefer **(a)** if it fits the embedding flow cleanly (single write per product); fall back to **(b)** if the order must be built from fully-linked items first. Either way the invariant is: **persisted `product.orderItemUrl` === the order item's final identifier.**

### Decision 2: Load the reverse chain on read, in the repositories

- `SoukaiBottleRepository.fetchBottles`: after resolving each `bottle.product`, `loadRelation("orderItem")` on the product, then on that order item `loadRelation("order")`, then on the order `loadRelation("seller")` (batch/dedupe by URL to avoid N× loads).
- `SoukaiOrderRepository.fetchOrders`: for each item's product, set/`loadRelation("orderItem")` so the product resolves back to its (already-loaded) order and seller. Since the order and seller are already in hand here, wire the relation from the in-memory order rather than re-fetching where possible.

Loading (not lazy per-render fetch) keeps `product-component` synchronous.

### Decision 3: Re-home the cross-resource link on sync

The existing sync already re-homes the order item → product reference (`productUrl`) from `local://` to the Pod product URL. The **reverse** reference (`product.orderItemUrl` → the Pod order item URL) MUST be re-homed the same way, so after sync the chain still resolves. This is the main risk area (two resources re-homed in one sync must have both directions remapped).

## Risks / Trade-offs

- **URL timing during ingestion** → the core bug; covered by Decision 1. Add a test asserting the persisted `orderItemUrl` equals the item's final URL.
- **Sync re-homing of both directions** → if only one side is remapped, the chain breaks after sync. Add an idempotent-sync test that reads the seller back from a re-homed product.
- **Read amplification** → loading orderItem→order→seller per product could be N fetches; dedupe by URL (orders are few relative to bottles).

## Migration Plan

Behavioral fix; no data migration. Products already ingested before this fix will still have an empty/stale `orderItemUrl` and will keep showing an empty "Quelle" until re-ingested — acceptable (note in the change). New ingestions get the correct link.
