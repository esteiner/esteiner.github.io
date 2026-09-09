## Context

Inbox ingestion runs when the cellarwork page opens. The page's `_bottlesTask` calls `KellermeisterService.ingestOrdersFromInbox()`, which:

1. `fetchCellarForCellarwork()` — resolves the target cellar.
2. `fetchUnprocessedOrders()` — reads every document in `{storageRoot}inbox/kellermeister/`, builds `SoukaiOrder`s, and records each order's source-document URL in a **shared, mutable field** on the repository: `inboxDocumentByOrderId` (a `Map` that is `.clear()`ed and rebuilt on every call).
3. For each order, `ingestOrder()` → `addBottles()` (save products + bottles), `saveProcessedOrder()` (persist locally), `deleteFromInbox()` (delete the source document, looked up in `inboxDocumentByOrderId`).

Two structural weaknesses make the multi-file case fragile:

- **Shared mutable map.** `deleteFromInbox()` resolves the document to delete from the repository-level `inboxDocumentByOrderId` map. Because `fetchUnprocessedOrders()` clears that map at the start of every read, any second read that overlaps an in-flight batch wipes the source URLs the batch still needs. `deleteFromInbox()` then finds `undefined` and silently no-ops — bottles get created but inbox files are left behind.

- **No single-flight guard + last-run-wins task.** `_bottlesTask` (from `@lit/task`) commits only the *latest* `run()`'s result (each run bumps an internal `_callId`; earlier runs' results are discarded). If a second `run()` starts while the first batch is mid-flight, the second reads a now-smaller inbox (the first run already deleted some files) and commits a **partial** bottle list as the final rendered value. The window is negligible for a single file but real for several. `loadBottles()` is called from `connectedCallback` and from every filter handler, so overlapping runs are reachable in normal use.

The user-visible contract we want: bottles are created and displayed **only after all inbox files are processed and deleted** — all-or-nothing.

## Goals / Non-Goals

**Goals:**
- Ingestion is single-flight: overlapping triggers await the in-flight run instead of racing it.
- Each order's inbox source-document URL travels with that order, so deletion is correct regardless of overlapping reads — no reliance on shared mutable repository state.
- The cellarwork page renders the ingested contents only after the whole batch is processed and all its inbox documents are deleted; a mid-batch failure does not render a partial cellar as final.
- No duplicate bottles when triggers overlap.

**Non-Goals:**
- Changing the inbox location, RDF shape, or the embedded-parts / re-homing behavior (all unchanged).
- Making ingestion work offline (it remains online-only).
- Adding parallelism — ingestion stays sequential; the point is correctness, not speed.
- Transactional rollback of already-persisted orders on failure. "Save-local-before-delete" already prevents data loss; a partial batch simply resumes on the next open.

## Decisions

### Decision 1: Carry the source-document URL on the order, drop the shared map

Attach each unprocessed order's inbox source-document URL to the order value returned by `fetchUnprocessedOrders()` (e.g. a field on `SoukaiOrder` set at read time, or return `{ order, sourceUrl }` pairs). `deleteFromInbox(order)` reads the URL from the order it is given.

- **Why:** The source URL is per-order, immutable data discovered at read time. Binding it to the order removes the only reason the repository held cross-call mutable state, so overlapping reads can no longer corrupt an in-flight batch's deletions.
- **Alternative considered — keep the map but make it additive (never clear):** grows unboundedly and still mixes state across unrelated reads; rejected.
- **Alternative considered — pass a `Map` through the call chain:** threads incidental state through the application service for no benefit over carrying it on the order.

### Decision 2: Single-flight guard in the application service

Guard `ingestOrdersFromInbox()` with an in-flight promise: if a batch is already running, return the same promise; clear it in a `finally`. This is the single serialization point that all callers funnel through.

- **Why:** The service is the one place every ingestion trigger passes through, and it owns the batch loop and cache invalidation. Guarding here protects the repository read/delete pair as a unit without the page needing to know about concurrency.
- **Alternative considered — guard in the page (`loadBottles`/task):** the page has several `run()` entry points and `@lit/task`'s last-run-wins semantics; the guard would have to defeat the task's own scheduling. Guarding the async use case is simpler and also protects any future caller.

### Decision 3: Render only the fully-drained result; surface failure explicitly

Keep the batch loop sequential and let `ingestOrdersFromInbox()` resolve only after the whole inbox is drained. In the page, ensure the value committed to the task reflects a completed batch: on success, show the batch's bottles; on failure, do not commit a partial batch as the completed render — show an error/retry state (the task's `error` branch) instead of the current behavior of swallowing the error and rendering whatever was ingested so far.

- **Why:** Matches the user's all-or-nothing expectation. Because single-flight (Decision 2) removes overlapping runs, the task no longer commits a partial run's result; the remaining work is to stop the page's own catch-and-render-partial path from masking a failure.
- **Alternative considered — batch all deletes after all saves:** narrows one window but does not address overlapping runs or partial-failure display; insufficient on its own.

## Risks / Trade-offs

- **[Order model carries transport/inbox concern]** Putting the inbox source URL on the domain order slightly mixes concerns. → Confine it to the `SoukaiOrder` infrastructure model (not the pure `Order` domain interface), or model it as a read-result pair so the domain `Order` stays clean.
- **[Single-flight returns a stale batch to a later caller]** A trigger that fires just after a batch finishes could want a fresh read. → The guard only coalesces *concurrent* calls; once the in-flight promise settles it is cleared, so the next trigger reads the inbox again. Filter-driven re-renders read from the already-ingested local cellar, not the inbox, so they are unaffected.
- **[Error/retry UX]** Showing an error state where the page previously showed partial contents is a visible behavior change. → This is intended: partial contents were the bug. Provide a clear retry (re-open / re-run) path.
- **[Regression coverage]** Tests are currently disabled in this repo. → Add focused unit tests for the service (single-flight, full-batch deletion) and repository (per-order source URL) even if the suite is not wired into CI, so the fix is demonstrable.
