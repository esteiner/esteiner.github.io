## Why

Opening the cellarwork page is supposed to pull unprocessed orders from the Pod inbox (`{storageRoot}inbox/kellermeister/`), turn each into products + bottles in the `cellarwork` cellar, and clear the source out of the inbox. This stopped working during the local-first migration: `SoukaiOrderRepository.fetchUnprocessedOrders()` was reduced to `return []` (deferred as an "open question on offline order ingestion"), so ingestion silently processes nothing. A second latent defect: the source-document deletion in `KellermeisterService.moveProcessedOrder` uses the global `fetch` (unauthenticated) instead of the session fetch, so even if orders were read, clearing the inbox would fail.

## What Changes

- Restore reading unprocessed orders from the Pod inbox container `{storageRoot}inbox/kellermeister/`, online, via the authenticated Solid engine — the same Pod-access pattern the sync layer already uses (`withEngine(new SolidEngine(session.fetch), …)`).
- When logged out or before the Pod base is resolved, `fetchUnprocessedOrders()` returns an empty list (no error) — inbox ingestion is inherently online.
- Ingest each unprocessed order into the `cellarwork` cellar (products + one bottle per ordered unit), save the processed order locally (re-homed to the Pod on the next sync), and **delete** its source document from the inbox using the **authenticated** fetch.
- Move the inbox deletion out of the application layer into the order repository (which owns Pod-inbox access), removing the direct `deleteSolidDataset(..., {fetch})` call and the infra import from `KellermeisterService`.

## Capabilities

### New Capabilities
- `inbox-order-ingestion`: Reading unprocessed orders from the Pod inbox and ingesting them into the cellarwork cellar when the cellarwork page opens, including online-only semantics and removal of processed sources from the inbox.

### Modified Capabilities
<!-- No existing spec covers order ingestion; nothing to modify. -->

## Impact

- `src/infrastructure/soukai/SoukaiOrderRepository.ts` — implement `fetchUnprocessedOrders()` against the Pod inbox via the authenticated engine; add inbox-source deletion. New dependencies: an auth accessor and the inbox container URL.
- `src/domain/Order/OrderRepository.ts` — add a method to remove a processed order's source document from the inbox.
- `src/application/KellermeisterService.ts` — route inbox deletion through the repository; drop the direct `deleteSolidDataset` import/usage.
- `src/infrastructure/cdi/CDI.ts` — wire `AuthService` and the inbox container accessor into `SoukaiOrderRepository`.
- `src/infrastructure/solid/PodContainerRegistry.ts` — derive the inbox container URL from the resolved Pod base.
- `src/infrastructure/web/pages/cellarwork-page.ts` — verify the existing ingestion trigger (logged-in guard) still behaves; add error handling if needed.
- No breaking changes to persisted local data. Inbox source documents are deleted from the Pod after successful ingestion (destructive, but restores the intended behavior).
