## Why

In `product-component`, the "Quelle" (source) line renders
`product.getOrderItem()?.getOrder()?.getSeller()?.getName()` — a **reverse** walk from a product back to its order's seller. It is always empty because that reverse link is neither reliably persisted nor loaded:

1. **Not loaded on read.** No code ever calls `loadRelation("orderItem")` on a product (only forward relations `order → seller` and `orderItem → product` are loaded). So `product.getOrderItem()` is `undefined` and the whole chain short-circuits to empty — in both the cellar view (`bottle-component`) and the order view (`order-item-component`).
2. **Not reliably persisted.** `SoukaiProductFactory.createProduct` does call `newProduct.relatedOrderItem.setRelated(newOrderItem)`, but during ingestion the product is saved **before** the order document is minted/saved (`saveProcessedOrder` runs last). At that point the order item has no stable URL, so the product's `orderItemUrl` (`km:orderItem`) is captured empty/stale.

## What Changes

- Persist a **stable** product → order-item link during ingestion: the product's `orderItemUrl` (`km:orderItem`) MUST point at the persisted order item's final URL (reorder ingestion so the order/items exist first, or set the link on the product and re-save after the order is saved).
- On read, **load** the reverse chain so a product resolves its order item → order → seller (and order date) in the views that show "Quelle".
- Ensure the cross-resource product ↔ order-item link **survives sync/re-homing** (local `local://` URLs remapped to Pod URLs on both sides), the same way the existing order-item → product reference is re-homed.
- Result: the product view's "Quelle" shows the seller name and order date instead of being blank.

## Capabilities

### New Capabilities
- `product-source-display`: showing a product's source (the seller name and order date of the order it came from) in the product detail view, backed by a persisted, sync-safe product → order → seller link.

### Modified Capabilities
<!-- None (the behavior is new/undocumented; captured as a new capability). -->

## Impact

- **Application**: `KellermeisterService.addBottles` — ordering of order/item/product persistence so the product → order-item link is stable.
- **Infra (soukai)**: `SoukaiProductFactory` / `SoukaiOrderFactory` link wiring; read paths that must `loadRelation` the reverse chain — `SoukaiBottleRepository` (bottle → product) and `SoukaiOrderRepository.fetchOrders` (order → items → product).
- **Sync**: re-homing of the product ↔ order-item cross-resource references (`src/application/sync/…`) so the link is valid after the order and product are re-homed to the Pod.
- **UI**: `product-component` "Quelle" line (should need no change once the chain resolves) — verified.
- **Tests**: repository/service tests for the persisted + loaded reverse link; an e2e/DOM check that "Quelle" shows the seller name.
