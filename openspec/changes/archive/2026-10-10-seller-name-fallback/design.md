# Design

## Context

`product-component` currently renders "Quelle" by navigating the chain `p.getOrderItem()?.getOrder()?.getSeller()?.getName()` inline. `OrderItem` already exposes `getPriceSource()`, which `SoukaiOrderItem` normalises to `undefined` for empty values through `orUndefined`. The product → order item → order → seller chain is already eager-loaded for the views (see the `product-source-display` spec), so no extra fetching is needed.

## Goals / Non-Goals

**Goals:**
- Keep the "seller name, else price source" rule in one place on the domain model rather than in the view.

**Non-Goals:**
- Showing which of the two values was used (no label or styling difference).
- Changing how `priceSource` is captured or persisted.
- Changing the order-date part of the "Quelle" line.

## Decisions

- **Getter on `OrderItem`: `getSellerName(): string | undefined`.** The order item is the only object that can see both values: the seller via its order, and its own price source. Putting the rule here keeps `product-component` a one-hop call and makes the rule reusable, for example in `order-item-component` later. The user's suggested name `getSellarName` is spelled `getSellerName` to match `getSeller()`.
  - *Alternative:* a helper in `product-component`. This was rejected because the rule would be view-local and duplicated if other views need it.
  - *Alternative:* `Product.getSourceName()`. This was rejected for now because the fallback data lives on the order item, and the user asked for the getter on `OrderItem`.
- **Treat empty or whitespace-only seller names as missing.** Implement it as `this.getOrder()?.getSeller()?.getName()?.trim() || this.getPriceSource() || undefined`. This ensures a seller node that exists but has a blank name still falls back.
- **Copy `priceSource` in `SoukaiOrderFactory.createOrderItem`.** Ingestion builds a fresh order item from the inbox item but currently copies only quantity, price and currency. Add `newOrderItem.priceSource = orderItem.getPriceSource()` next to those lines. It is the single place where inbox data becomes persisted local data, and `orUndefined` already maps a missing value to `undefined`.
- **Implement in `SoukaiOrderItem` with a null-safe order access.** `order` may be unloaded or undefined, so use optional chaining throughout.

## Risks / Trade-offs

- [Some `priceSource` values may be URLs or codes rather than human-friendly names.] → This is accepted: showing it is better than a blank field. The display can be refined later without changing the getter's contract.
- [Orders that were ingested earlier have no stored price source.] → This is accepted: no backfill. The fallback applies to orders ingested from now on (and to any existing data that already has `km:priceSource`).
- [Inbox test fixtures without `getPriceSource` would throw in `createOrderItem`.] → Add `getPriceSource` to the order-item fixture in `SoukaiOrderRepository.test.ts`.
- [Adding a method to the `OrderItem` interface could break structural test fakes.] → Run `tsc`/`vitest` and add the method to any fake that fails to compile.
