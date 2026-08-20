## Why

When an inbox order is ingested, the persisted order is inconsistent: `KellermeisterService.addBottles` builds a fresh order (with its seller and new order items) but never saves it, while `moveProcessedOrder` instead persists `unprocessedOrder.clone()` — the raw inbox order, whose items still reference the now-deleted inbox product URLs. The order's `customer` (the object referenced by `schema:customer`) is never carried over at all (there is only an unused `customerUrl` key field). The result is a stored order that doesn't reliably contain its seller, its customer, or order items pointing at the real local products, and isn't guaranteed to live in a single RDF document.

## What Changes

- Persist the **freshly-built order** produced during ingestion (its order items reference the newly-created local products), instead of discarding it and saving the raw inbox clone.
- Save the order's **seller**, **customer**, and **all order items** in the **same RDF document** as the order (single Turtle resource), via same-document Soukai relationships.
- Introduce a **customer** on the order: a domain `Customer`, an `Order.getCustomer()` accessor, a `SoukaiCustomer` model, and a same-document `customer` relationship on `SoukaiOrder` — the object referenced by `schema:customer`.
- Copy the customer (like the seller) from the source inbox order into the built order during ingestion, and load the customer relation when reading unprocessed orders so it is available to copy.
- Preserve the embedded seller, customer, and order items when the locally-stored order is **re-homed to the Pod during sync** (the reconstruction previously copied only the order's own attributes and dropped the embedded models), re-homing each item's product reference to its Pod URL.

## Capabilities

### New Capabilities
<!-- None; this refines the existing inbox-order-ingestion capability. -->

### Modified Capabilities
- `inbox-order-ingestion`: The ingested order that is persisted now embeds its seller, customer, and all order items in one document, and is the freshly-built order (not the raw inbox clone). Reading unprocessed orders also loads the customer relation.

## Impact

- `src/domain/Order/Customer.ts` — new domain interface.
- `src/domain/Order/Order.ts` — add `getCustomer(): Customer | undefined`.
- `src/infrastructure/soukai/model/SoukaiCustomer.schema.ts` + `SoukaiCustomer.ts` — new model for `schema:customer`.
- `src/infrastructure/soukai/model/SoukaiOrder.ts` — add a same-document `customer` relationship and `getCustomer()`.
- `src/infrastructure/soukai/model/SoukaiOrderFactory.ts` — copy the customer into the built order (alongside the existing seller copy).
- `src/infrastructure/soukai/SoukaiOrderRepository.ts` — boot `SoukaiCustomer`; load the `customer` relation in `fetchUnprocessedOrders`.
- `src/application/KellermeisterService.ts` — persist the freshly-built order (embedding seller/customer/items) and delete the inbox source; stop saving the raw clone.
- `src/infrastructure/solid/SolidSyncService.ts` — preserve embedded seller/customer/items when re-homing/creating an order on the Pod (`rebuildOrder`), re-homing each item's `productUrl`.
- No breaking change to persisted local data; newly ingested orders simply become single, self-contained documents.
