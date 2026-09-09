## Why

When several files sit in the Pod inbox (`{storageRoot}inbox/kellermeister/`) and the user opens the cellarwork page, ingestion can surface a partial result: some bottles appear while inbox files remain undeleted, or bottles are duplicated. The user expects an all-or-nothing outcome — bottles are created and shown only after **every** inbox file has been processed and deleted. The current implementation is neither atomic nor safe against a second ingestion run overlapping the first, so with multiple files the timing window is wide enough for the bug to appear.

## What Changes

- Make inbox ingestion **re-entrant-safe (single-flight)**: while an ingestion is in progress, additional triggers (a second page-open, a filter interaction, a re-run of the bottles task) MUST await the in-flight ingestion instead of starting a concurrent one.
- Stop relying on the repository's shared, mutable `inboxDocumentByOrderId` map to locate the document to delete. That map is cleared and rebuilt on every `fetchUnprocessedOrders()` call, so an overlapping fetch corrupts an in-flight run's deletions (bottles created, files not deleted). Each order MUST carry its own source-document URL so deletion is correct regardless of intervening reads.
- Make batch ingestion **atomic from the user's perspective**: the cellarwork page renders the ingested contents only after all inbox orders are processed **and** their source documents are deleted. A failure part-way through MUST NOT render a partial cellar as if ingestion had completed; it surfaces an error/retry state instead.
- Ensure no duplicate bottles are produced when the same order is seen by two overlapping runs.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `inbox-order-ingestion`: Add requirements that batch ingestion is (a) single-flight / re-entrant-safe, (b) atomic all-or-nothing with respect to what the page displays, and (c) that each order's inbox source document is deleted using a per-order source URL rather than shared mutable repository state. Strengthen the existing "Ingest inbox orders" and "Processed orders are removed from the inbox" requirements to cover the multi-file case.

## Impact

- `src/application/KellermeisterService.ts` — `ingestOrdersFromInbox`, `ingestOrder` (batch orchestration, single-flight guard, cache invalidation).
- `src/infrastructure/soukai/SoukaiOrderRepository.ts` — `fetchUnprocessedOrders`, `deleteFromInbox` (remove shared-map dependency; carry source URL per order).
- `src/domain/Order/Order.ts` / `SoukaiOrder` — carry the inbox source-document URL on the order (or return read results as order+source pairs).
- `src/infrastructure/web/pages/cellarwork-page.ts` — `_bottlesTask` / `loadBottles` (render only after ingestion fully completes; do not commit partial results).
- No new dependencies. No breaking changes to routes or storage layout.
