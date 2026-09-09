## 1. Carry the inbox source-document URL per order

- [x] 1.1 Add an inbox source-document URL to the read result: set it on each `SoukaiOrder` (infrastructure-only field) or return `{ order, sourceUrl }` pairs from `fetchUnprocessedOrders()` in `SoukaiOrderRepository.ts`.
- [x] 1.2 Populate the source URL at read time from `document.url` for each order built via `createManyFromDocument`.
- [x] 1.3 Change `deleteFromInbox(order)` to resolve the source URL from the passed order (not from a shared field); no-op safely when absent.
- [x] 1.4 Remove the shared `inboxDocumentByOrderId` map and its `.clear()`/`.set()` usage.

## 2. Make ingestion single-flight

- [x] 2.1 Add an in-flight promise guard in `KellermeisterService.ingestOrdersFromInbox()`: if a batch is running, return the same promise; clear it in `finally`.
- [x] 2.2 Ensure the batch loop is fully sequential and `await`ed, and that products/orders/bottles caches (`cachedBottles`, `cachedOrders`) are invalidated once after the batch completes.
- [x] 2.3 Verify no order can be processed twice when two triggers overlap (single read + single delete per order).

## 3. Atomic display on the cellarwork page

- [x] 3.1 In `cellarwork-page.ts` `_bottlesTask`, render the ingested cellarwork contents only after `ingestOrdersFromInbox()` resolves (whole batch processed and all documents deleted).
- [x] 3.2 Stop swallowing an ingestion failure and rendering partial contents: on failure, surface the task's `error` branch with a retry/re-open affordance instead of a partial `complete` render.
- [x] 3.3 Confirm filter-driven `loadBottles()` re-runs read from the local cellar and do not re-trigger inbox ingestion mid-batch (guarded by `shouldIngestFromInbox()` + single-flight).

## 4. Verification

- [x] 4.1 Add a unit test: batch of N inbox documents ingested → N-order bottles created and all N source documents deleted (per-order URL resolution).
- [x] 4.2 Add a unit test: two overlapping `ingestOrdersFromInbox()` calls coalesce (single read, single delete per order, no duplicate bottles).
- [x] 4.3 Add a unit test: a mid-batch failure leaves already-saved orders persisted and the unprocessed documents still in the inbox; the page does not present the partial batch as complete.
- [x] 4.4 Manually verify with multiple files seeded in `{storageRoot}inbox/kellermeister/`: open cellarwork → bottles appear only after all files are processed and the inbox is empty.
