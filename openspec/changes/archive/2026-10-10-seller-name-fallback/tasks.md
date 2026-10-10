## 1. Domain

- [x] 1.1 Add `getSellerName(): string | undefined` to the `OrderItem` interface (`src/domain/Order/OrderItem.ts`). Its doc comment should say that it returns the order's seller name, falls back to the price source, and is otherwise undefined.

## 2. Infrastructure

- [x] 2.1 Implement `getSellerName()` in `SoukaiOrderItem` (`src/infrastructure/soukai/model/SoukaiOrderItem.ts`) using null-safe access, and treat a blank seller name as missing.
- [x] 2.2 In `SoukaiOrderFactory.createOrderItem` (`src/infrastructure/soukai/model/SoukaiOrderFactory.ts`), copy `priceSource` from the incoming order item (`orderItem.getPriceSource()`).
- [x] 2.3 Add `getPriceSource` to the inbox order-item fixture in `SoukaiOrderRepository.test.ts`. Extend the same-document persistence test (or add one) to assert that the persisted, re-read order item has the same price source.
- [x] 2.4 Add unit tests for `getSellerName()` covering: seller name present (wins over price source), seller missing → price source, seller with blank name → price source, and neither → undefined.

## 3. View

- [x] 3.1 In `product-component.ts` ("Quelle"), replace `p?.getOrderItem()?.getOrder()?.getSeller()?.getName()` with `p?.getOrderItem()?.getSellerName()`, and keep the order date rendering unchanged.

## 4. Verification

- [x] 4.1 Run `npm run build` (tsc) and the vitest suite, and fix any `OrderItem` fakes that no longer type-check.
- [x] 4.2 Manually ingest an inbox order whose item has a price source but whose order has no seller name, then check that "Quelle" shows the price source. Also check that a product with a seller name still shows the seller.
