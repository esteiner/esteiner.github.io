## 1. Domain

- [x] 1.1 Add a `Customer` interface in `src/domain/Order/Customer.ts` (mirroring `Seller`: `getId()`, `getName()`, `getEmail()`).
- [x] 1.2 Add `getCustomer(): Customer | undefined` to the `Order` interface in `src/domain/Order/Order.ts`.

## 2. Customer model

- [x] 2.1 Add `SoukaiCustomer.schema.ts` (`schema:Organization` — the type real inbox orders use for the customer, mirroring the seller; fields name/email/url) and `SoukaiCustomer.ts` (implements `Customer`, `timestamps = false`), mirroring `SoukaiSeller`. (The `customer` relation only resolves when this rdfsClass matches the node's type in the inbox data.)

## 3. Order model relationships

- [x] 3.1 In `SoukaiOrder`, add a `customer` field + `customerRelationship()` = `belongsToOne(SoukaiCustomer, "customerUrl").usingSameDocument(true)`, and implement `getCustomer()`.

## 4. Factory

- [x] 4.1 In `SoukaiOrderFactory.createOrder`, copy the customer from the source order into `newOrder.customer` (guarded like the seller copy).
- [x] 4.2 Ensure the built order items carry a `productUrl` linking to the newly-created local product (set it in `addBottles`/factory so embedded items reference real local products).

## 5. Repository

- [x] 5.1 In `SoukaiOrderRepository`, boot `SoukaiCustomer` and load the `customer` relation in `fetchUnprocessedOrders` (alongside `seller` and `positions`).
- [x] 5.2 Add a regression test: seed an inbox order whose `schema:customer` points to a `schema:Organization` node (authored as a raw engine document, matching `notes/data/inbox-orders/...`, independent of `SoukaiCustomer`), then assert `fetchUnprocessedOrders` loads both the seller and the customer.
- [x] 5.3 Add `SoukaiContactPoint` (schema:ContactPoint; name/email) and a same-document `contactPoint` relationship on `SoukaiCustomer`; `getName()`/`getEmail()` prefer the contactPoint (real inbox orders carry the customer's email there, not on the Organization node). Load `customer.contactPoint` in `fetchUnprocessedOrders`/`fetchOrders`; boot `SoukaiContactPoint`. Assert the customer's contactPoint name/email are read from the inbox.
- [x] 5.4 Preserve the contactPoint as a nested same-document resource (order → customer → contactPoint) rather than flattening it: the factory copies the source customer's contactPoint into the built order, and the sync `loadEmbedded`/`rebuildOrder` carry it so it re-homes to the Pod. Add a sync test asserting the contactPoint (name/email) lands on the Pod embedded in the order document.
- [x] 5.5 Carry the customer's `schema:address` (a direct field on the Organization): add an `address` field + `getAddress()` (domain `Customer` + `SoukaiCustomer`), copy it in the factory, and include it in the sync `rebuildOrder`. Assert the address is read from the inbox and reaches the Pod.
- [x] 5.6 Carry the seller's `schema:url`: the seller schema's `url` field was dead (the name collides with SolidModel's own resource identity), so replace it with a `homepage` field (`FieldType.Key` → `schema:url`, read as an IRI) + `getUrl()` (domain `Seller` + `SoukaiSeller`), copy it in the factory, and include it in the sync `rebuildOrder`. Assert the seller url is read from the inbox and reaches the Pod.
- [x] 5.7 Carry the product's `km:weinname` (the wine name, distinct from `schema:name`): add a `weinname` field + `getWineName()` (domain `Product` + `SoukaiProduct`) and copy it in `SoukaiProductFactory.createProduct`. Products sync via the standard `getAttributes()` path, so the field re-homes automatically. Assert the factory copies it and it survives sync to the Pod.
- [x] 5.8 Resolve each order item's product when reading persisted orders: in `fetchOrders`, after loading `positions`, `loadRelation("product")` per item — the product is a separate resource (referenced by `productUrl`), so it is not auto-loaded like the same-document seller/customer/items. Assert `getProduct()` is resolved after `fetchOrders`.

## 6. Application service

- [x] 6.1 Make `addBottles` return the freshly-built `newOrder` (with seller, customer, and order items attached).
- [x] 6.2 In `ingestOrder`, persist the built order via `saveProcessedOrder(newOrder)` and delete the inbox source via `deleteFromInbox(originalOrder)`; remove the clone-saving `moveProcessedOrder` path. Save-local-before-delete ordering preserved.

## 7. Sync (re-home embedded parts to the Pod)

- [x] 7.1 In `SolidSyncService`, mark the `orders` collection as `embedded` and load `seller`/`customer`/`positions` before reconciling, so the embedded models travel with the order on re-home and create (they are absent from `getAttributes()`).
- [x] 7.2 Rebuild the order (`rebuildOrder`) when re-homing and when creating on either side: re-create the embedded seller, customer, and items attached to a fresh order rooted at the target URL, and re-home each item's cross-resource `productUrl` to the Pod base (products are swept first).
- [x] 7.3 Add a `local-first.test.ts` acceptance test: an order embedding a seller, a customer, and two items (each referencing a provisional product) is synced; assert the Pod order embeds the seller, customer, and both items in one document, the items reference the re-homed Pod products, and a second sync is idempotent.

## 8. Verification

- [x] 8.1 Add/extend tests (IndexedDBEngine + fake-indexeddb; simulate the Pod inbox as in `SoukaiOrderRepository.test.ts`): an inbox order with seller, customer, and 2 items is ingested; assert the persisted order + seller + customer + both items share the order's document URL, items reference the new local products, and a missing customer is tolerated.
- [x] 8.2 Typecheck (`tsc --noEmit`) and run the full test suite.
- [x] 8.3 Manually verify in the running app (best-effort): ingest an inbox order and confirm the stored order document contains the seller, customer, and order items. (Smoke-tested: production build succeeds; the cellarwork page loads ("Kellerarbeit Eingang") with no console errors, so booting SoukaiCustomer + the new customer relation don't break the app. The logged-in inbox-ingest round-trip needs live Solid Pod credentials not available here; the same-document embedding — order + seller + customer + items sharing one document URL, items referencing the local product — is verified end-to-end in SoukaiOrderRepository.test.ts against a simulated Pod inbox.)
