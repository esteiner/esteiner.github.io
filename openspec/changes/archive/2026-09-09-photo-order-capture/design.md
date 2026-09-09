## Context

Orders currently enter the cellar only through the Pod inbox: a Turtle order file is dropped into `{storageRoot}inbox/kellermeister/` (via the `InboxUploader` debug affordance on the profile page), and the cellarwork page ingests it on open (`KellermeisterService.ingestOrdersFromInbox()` → `ingestOrder()`), producing products and one bottle per ordered unit in the `cellarwork` cellar.

The footer's **Hinzufügen** button (`kellermeister-footer.handleAddClick`) is a `// Todo`. We want it to capture **two** photos of a wine bottle — its front and its back label — convert them to an order via an external REST service, and land the resulting bottles in `cellarwork`. Per the product decision, the converted order is ingested **directly** into `cellarwork` — it does **not** transit the Pod inbox.

Relevant existing pieces we build on:
- `KellermeisterService.ingestOrder(order, cellarworkId)` — persists the freshly-built order locally and creates bottles; its final `orderRespository.deleteFromInbox(order)` call is already a no-op for an order with no inbox source URL.
- `SoukaiOrderRepository.fetchUnprocessedOrders()` — materializes orders from an inbox document's RDF graph via `SoukaiOrder.createManyFromDocument(document)` with **no** network dereferencing of embedded (synthetic, CORS-blocked) identifiers.
- `CDI` (singleton) wires repositories/services; the footer can reach it with `CDI.getInstance()` like the pages do.
- Turtle parsing is available through `@noeldemartin/solid-utils` (`turtleToQuads` / `turtleToQuadsSync`), already a transitive dependency of the Soukai stack.

## Goals / Non-Goals

**Goals:**
- Wire the footer Add button to: capture front + back photos → POST both to conversion service → receive Turtle → ingest directly into `cellarwork` → show the result.
- Keep HTTP behind an application-layer port; keep the endpoint configurable.
- Reuse the existing per-order ingestion (products + bottles + local save) and the existing embedded-graph materialization used for the inbox.

**Non-Goals:**
- No change to the Pod inbox path or the `inbox-order-ingestion` spec.
- No capture beyond the two required photos (front + back) per Add action; no multi-bottle batch capture.
- No offline queueing of conversions; conversion is online-only (it is a network call).
- Defining or building the conversion service itself (external).

## Decisions

### Decision 1: Ingest directly, not via the inbox

The converted Turtle is parsed into order model(s) in the browser and ingested straight into `cellarwork`, rather than uploaded to the Pod inbox and re-read.

- **Why:** The user's intent is immediate feedback ("add this bottle"). Round-tripping through the Pod inbox adds latency, a network write + read, and couples the flow to inbox reachability. Direct ingestion reuses `ingestOrder()` unchanged.
- **`deleteFromInbox` stays a no-op:** a converted order carries no `inboxSourceUrl`, and `SoukaiOrderRepository.deleteFromInbox` already returns early when there is no source URL — so `ingestOrder()` works as-is with no branching.
- **Alternative considered — upload to inbox + navigate (the two original options):** rejected per product decision; would re-use `InboxUploader` but reintroduce the round-trip and the eventual-consistency gap between upload and ingest.

### Decision 2: New `OrderConversionService` port + `HttpOrderConversionService` impl

Add `src/application/ports/OrderConversionService.ts`:

```ts
export interface OrderConversionService {
    /** Whether a conversion can be attempted (endpoint configured), and if not, why. */
    availability(): OrderConversionAvailability;
    /** Convert front + back bottle images to an order as Turtle. Rejects on precondition/transport/status errors. */
    convert(front: Blob, back: Blob): Promise<string>; // returns Turtle
}
```

Implementation `src/infrastructure/http/HttpOrderConversionService.ts`: reads both images as base64, POSTs `{ "front": "<base64>", "back": "<base64>" }` (JSON) to the configured URL, and returns `await response.text()` as Turtle when `response.ok`, else rejects with a message including the status.

- **Why a port:** mirrors `InboxUploader` — the UI never speaks HTTP directly, and the request/response contract lives somewhere testable.
- **Alternative considered — reuse `InboxUploader`:** wrong abstraction (that writes to the Pod), and we are not going through the inbox.

### Decision 3: Endpoint via `VITE_ORDER_CONVERSION_URL`

The endpoint is a build-time env var, matching the existing `VITE_*` convention (`.env`, `.env.local.example`). `availability()` returns unavailable with a reason when the var is empty, so the footer can fail cleanly (as the profile inbox upload does for its precondition). Add a Vite env typing entry for the new var.

- **Alternative considered — runtime config from the Pod/profile:** heavier; no current mechanism. A build-time var is consistent with `VITE_BUILD_VERSION`, `VITE_BASE_PATH`.

### Decision 4: Turtle → orders lives in the repository, exposed on `OrderRepository`

Add `OrderRepository.parseOrders(turtle: string): Promise<Order[]>` (name TBD in tasks), implemented in `SoukaiOrderRepository` by turning the Turtle into the document shape `SoukaiOrder.createManyFromDocument` consumes (parse Turtle → quads → engine document keyed by a synthetic base URL) and returning the materialized orders — **without** dereferencing embedded identifiers, exactly as the inbox read does.

- **Why in the repository:** materializing Soukai models from RDF is infrastructure detail; the application service should stay ignorant of Turtle/quads. `KellermeisterService` gets a new use case `ingestOrderFromTurtle(turtle)` that calls `parseOrders` then `ingestOrder` per order and returns the `cellarwork` cellar (invalidating caches like the inbox path does).
- **Alternative considered — parse in a web component or the HTTP impl:** leaks RDF/Soukai internals into the UI/transport layers.

### Decision 5: Footer drives capture; navigate to cellarwork after success

`handleAddClick` drives a two-step capture using a hidden `<input type="file" accept="image/*" capture="environment">`: prompt for the **front** image, then re-open the input for the **back** image (reusing one input, resetting its value between steps, and labeling the current step for the user). Once both blobs are held: set an in-progress flag (guard against re-entry), call `convert(front, back)` then `ingestOrderFromTurtle()`, then `Router.go` to the cellarwork page (which renders the `cellarwork` cellar). If the user cancels before both are captured, abort quietly. On error during convert/ingest, surface it and clear the in-progress flag without navigating.

- **Why navigate rather than render in-place:** the footer is shared across pages and has no cellar view; the cellarwork page already renders the `cellarwork` cellar and its `_bottlesTask`. Since ingestion already happened, `shouldIngestFromInbox()` re-running the (now-empty) inbox ingestion is harmless.
- **Cache freshness:** `ingestOrder` already nulls `cachedOrders`/`cachedBottles`; navigating constructs a fresh cellarwork task, so the new bottles show.

## Risks / Trade-offs

- **Turtle → engine-document shape may not exactly match what `createManyFromDocument` expects** → Prototype against a real conversion sample early; reuse the exact document construction `engine.readDocuments` yields for the inbox (same code path) rather than hand-rolling. This is the main technical unknown.
- **Converted-order identifiers are synthetic/foreign and non-dereferenceable** (like inbox orders) → Reuse the inbox path's guarantee of no network dereferencing of embedded identifiers; add a scenario/test asserting no fetch of embedded URLs.
- **Conversion latency/failure on mobile networks** → Explicit in-progress indication and a clear failure state; single-flight guard prevents double submits. No partial success is presented as complete.
- **Large base64 payloads** (two full-res photos) → Acceptable for v1; note as a possible future optimization (downscale before upload) in Open Questions. Two images roughly double the payload versus one.
- **`capture` attribute support varies** → It degrades gracefully to a normal file picker, satisfying the "pick an existing image" fallback.

## Migration Plan

Additive only. New port + impl + service method + repository method + footer wiring + one env var. No data migration, no change to existing inbox ingestion. Rollback = revert the change and unset `VITE_ORDER_CONVERSION_URL`; with the var unset the feature reports "not available" and the rest of the app is unaffected.

## Open Questions

- Exact JSON field names the conversion service expects (assumed `front` and `back`) and whether it wants extra metadata (mime type, filename). To confirm with the service contract before/while implementing the HTTP impl.
- Should the captured image be downscaled/compressed client-side before upload to bound payload size? (Deferred; not required for v1.)
- Should a converted order also be synced to the Pod immediately, or left to the normal pending-sync flow? (Assumed: normal sync, same as inbox-ingested orders.)
