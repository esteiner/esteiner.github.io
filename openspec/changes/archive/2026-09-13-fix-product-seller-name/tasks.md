## 1. Persist a stable product → order-item link (ingestion)

- [x] 1.1 In `KellermeisterService.addBottles` (and/or the factories), ensure the product's `orderItemUrl` (`km:orderItem`) is set to the order item's **final** persisted URL — either by saving the order before creating products, or by setting the link and re-saving each product after `saveProcessedOrder` mints the order.
- [x] 1.2 Verify `SoukaiOrderItem.relatedOrder` (km:order) is set to the order so `orderItem.getOrder()` resolves (already wired in `createOrderItem` — confirm it survives save/embedding).

## 2. Load the reverse chain on read

- [x] 2.1 `SoukaiBottleRepository.fetchBottles` — after resolving each `bottle.product`, load the product's `orderItem` → its `order` → the order's `seller` (dedupe by URL so shared products/orders load once).
- [x] 2.2 `SoukaiOrderRepository.fetchOrders` — ensure each item's product resolves back to its order item/order/seller (wire from the already-loaded order where possible instead of re-fetching).

## 3. Sync re-homing of the cross-resource link

- [x] 3.1 Ensure the product ↔ order-item reference is re-homed on sync: when the order and products are re-homed to the Pod, remap `product.orderItemUrl` to the Pod order-item URL (mirroring the existing order-item → product re-homing). Confirm the chain resolves after sync and that re-running sync is idempotent.

## 4. UI

- [x] 4.1 Confirm `product-component` "Quelle" now renders the seller name (+ order date) with the resolved chain; adjust only if a fallback/empty rendering needs tidying.

## 5. Verify

- [x] 5.1 Add a repository/service test: after ingesting an order with a seller, a read-back product resolves `getOrderItem().getOrder().getSeller().getName()` to the seller name, and the persisted `orderItemUrl` equals the item's final URL.
- [x] 5.2 Add a sync test: after re-homing to the Pod, the product still resolves its order → seller (and sync is idempotent).
- [x] 5.3 Verified the exact expression product-component renders (`product.getOrderItem().getOrder().getSeller().getName()`) resolves to the seller via BOTH production read paths — the cellar path (`SoukaiProductRepository.fetchAll`) and the order-view path (`SoukaiOrderRepository.fetchOrders`) — in `local-first.test.ts`. (No browser DOM assertion added: "Quelle" only renders in expandable contexts and the unit env is node-only; the template is a thin projection of the now-resolving chain.)
- [x] 5.4 Run `npm run build` (tsc + unit tests + vite); confirm green.
