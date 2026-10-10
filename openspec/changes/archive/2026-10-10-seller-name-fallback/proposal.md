# Proposal

## Why

Some products show an empty "Quelle" in the product detail view because their order has no seller (or the seller has no name). However, the order item often still has a `priceSource` (where the price came from). That would be a useful source to show in place of a blank field.

## What Changes

- Add a new getter `getSellerName(): string | undefined` to the domain `OrderItem` interface. It returns the name of the order's seller and falls back to the order item's `getPriceSource()` when the seller name is not available. It returns `undefined` if neither is available.
- Implement the getter in `SoukaiOrderItem`.
- `product-component` ("Quelle") uses `getOrderItem()?.getSellerName()` instead of navigating `getOrder()?.getSeller()?.getName()` directly. The order date is still shown as before.
- `SoukaiOrderFactory.createOrderItem` copies `priceSource` from the incoming (inbox) order item to the newly built order item. Currently the value is dropped during ingestion, so the fallback would never have data to show for newly ingested orders.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `product-source-display`: the "Quelle" line falls back to the order item's price source when no seller name is available. It is empty only when neither value exists.
- `inbox-order-ingestion`: ingestion carries the order item's price source over to the persisted order item.

## Impact

- `src/domain/Order/OrderItem.ts`: new interface method `getSellerName()`.
- `src/infrastructure/soukai/model/SoukaiOrderItem.ts`: implementation.
- `src/infrastructure/web/components/product-component.ts`: "Quelle" rendering.
- `src/infrastructure/soukai/model/SoukaiOrderFactory.ts`: copy `priceSource` in `createOrderItem`.
- Test fakes that implement `OrderItem` structurally may need the new method. Most use `as unknown as` casts and are unaffected.
- No schema change: `km:priceSource` already exists on order items. Orders ingested before this change don't have a price source stored and are not backfilled.
