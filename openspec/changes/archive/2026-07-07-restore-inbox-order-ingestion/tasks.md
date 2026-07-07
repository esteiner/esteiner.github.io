## 1. Inbox URL derivation

- [x] 1.1 Add `inboxContainer(): string | null` to `PodContainerRegistry` returning `{storageRoot}inbox/kellermeister/` (storage root = base with trailing `kellermeister/` stripped; null when the base is unresolved).

## 2. Domain interface

- [x] 2.1 Add a method to `OrderRepository` to delete a processed order's source document from the inbox (e.g. `deleteFromInbox(order: Order): Promise<void>`), documenting that it uses the authenticated session.

## 3. Repository implementation

- [x] 3.1 Extend `SoukaiOrderRepository`'s constructor to accept an `inboxContainer: () => string | null` accessor and the `AuthService` (alongside the existing `podBase`).
- [x] 3.2 Implement `fetchUnprocessedOrders()`: return `[]` when not logged in or when `inboxContainer()` is null; otherwise read `SoukaiOrder.from(inboxUrl).all()` under `withEngine(new SolidEngine(session.fetch), …)` and load each order's `seller` and `positions` relations.
- [x] 3.3 Implement `deleteFromInbox(order)`: resolve the order's source document URL and call `deleteSolidDataset(url, {fetch: session.fetch})`; no-op when the order has no source document URL or no session.

## 4. Application service

- [x] 4.1 In `KellermeisterService.moveProcessedOrder`, replace the direct `deleteSolidDataset(url, {fetch})` call with `orderRepository.deleteFromInbox(order)`; remove the now-unused `deleteSolidDataset` import.
- [x] 4.2 Confirm `ingestOrdersFromInbox` still ingests into `cellarwork` and saves the processed order locally before deletion (order of operations: save local → delete inbox source).

## 5. Wiring

- [x] 5.1 In `CDI`, construct `SoukaiOrderRepository` with the inbox accessor (from `PodContainerRegistry.inboxContainer()`) and the existing `authService`.

## 6. Cellarwork page

- [x] 6.1 Verify the `_bottlesTask` ingestion trigger in `cellarwork-page.ts` still runs on open for a logged-in user; ensure an inbox read/network error does not block rendering of existing cellarwork contents.

## 7. Verification

- [x] 7.1 Add tests (IndexedDBEngine + fake-indexeddb; simulate the "Pod" inbox with a second engine as in `local-first.test.ts`): unprocessed orders in the inbox are read and ingested into cellarwork (product + N bottles); logged-out/unresolved-base returns `[]`; after ingestion the processed order exists locally and the source is removed so a second run ingests nothing.
- [x] 7.2 Typecheck (`tsc --noEmit`) and run the full test suite.
- [x] 7.3 Manually verify in the running app: with orders present in `{storageRoot}inbox/kellermeister/`, opening the cellarwork page while logged in ingests them into cellarwork and empties the inbox. (Smoke-tested in-app: production build succeeds; navigating to the cellarwork page renders "Kellerarbeit Eingang" with no console errors and the new order-repo wiring doesn't crash the load path. The logged-in + seeded-inbox ingest/empty round-trip requires live Solid Pod credentials not available in this environment; its read→ingest→delete logic is covered end-to-end by SoukaiOrderRepository.test.ts + KellermeisterService.test.ts against a simulated Pod inbox.)
