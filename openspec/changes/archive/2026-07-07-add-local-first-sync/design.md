## Context

Kellermeister is a single-user, multi-device SPA. Its stack is Soukai + soukai-solid (RDF/Turtle in a Solid Pod), Lit web components, Vite, TypeScript. Today it is Pod-first: the global engine is `SolidEngine` and no repository can be constructed before login resolves a `storageUrl`. We are inverting this to local-first, adapting the pattern already validated in the sibling prototype `solid-local-first-recipes`.

The prototype's domain is a single flat aggregate (`Recipe`). Kellermeister's is a graph of cross-referencing aggregates (`Cellar`, `Bottle`, `Product`, `Order`, with `Rating`, `OrderItem`, `Seller` as children). The decisions below reuse the prototype's proven mechanics (engine inversion, provisional identity, idempotent re-home, single-flight sync, LWW, soft-delete) and add what the graph requires (per-resource layout, cross-resource reference rewriting).

Because the app is single-user, concurrent-edit conflict resolution stays simple: soukai-solid's operation-log `synchronize()` uses **Last-Write-Wins per property** (ordered by Hybrid Logical Clock timestamps), which converges correctly for one author across devices — merging **per property**, not per document.

## Goals / Non-Goals

**Goals**
- Create cellars/bottles/products/orders with **no login**; instant, fully-offline local reads and writes.
- Eventual, resilient synchronization to the Pod, triggered on-reconnect and manually.
- A per-resource Pod layout in which the core **bottle-transfer** operation is a single-property change on an independently-addressable resource.
- Preserve the CRDT operation history across load-modify-save so sync converges.
- Visible sync/offline state in the UI.

**Non-Goals**
- Multi-user / real-time collaboration (LWW is intentionally not a full concurrent-merge CRDT).
- Dirty-set/outbox optimization (start with a container sweep).
- Migration of existing single-document Pod data.
- Server-side components.

## Decisions

### D1 — Global engine is IndexedDB; the Pod is reached only via scoped `withEngine`
`main.ts` calls `setEngine(new IndexedDBEngine(...))` and `bootSolidModels()`. Repositories read/write IndexedDB exclusively and are always available offline. The **only** code that reaches the Pod is the sync layer, via `withEngine(new SolidEngine(fetch), () => …)`. This structurally enforces local-first — the UI and domain cannot accidentally block on the network.
*Alternative rejected:* keep `SolidEngine` global and add a local cache. Rejected — it keeps login as a hard precondition and lets network latency leak into every read.

### D2 — `CDI` no longer requires a `storageUrl` to build repositories
`CDI.setStorageUrl()` currently gates construction of every repository and service. Repositories become local-only and are constructed eagerly at startup. The Pod container base is resolved lazily, only when a session exists, and handed to the sync layer.
*Consequence:* the login handler in `landing-page.ts` stops calling `setStorageUrl()` as a precondition and instead triggers a sync.

### D3 — Per-resource data model; children embedded only when singly-owned
Synced roots (own document, own operation log, swept independently): **Cellar, Bottle, Product, Order**. Embedded children (same document as their parent, no independent identity): **Rating** in Product; **OrderItem** and **Seller** in Order. `Product` is a root because it is referenced by *both* `Bottle` and `OrderItem` and therefore cannot be embedded.
*Rationale:* `Bottle` as its own resource makes **bottle transfer** (change of `cellarUrl`) a single-property edit on one small resource — the cleanest possible unit for LWW and for the per-cellar queries the UI actually issues. Embedding bottles in `Cellar` was rejected because a transfer would become delete-here + create-there, discarding the bottle's identity and operation log. Embedding bottles in `Product` was rejected because the dominant query is per-cellar (not per-product), it would couple every bottle write to a shared catalog/provenance document, and it does not remove the reference-rewrite machinery.

### D4 — Pod layout: one `kellermeister/` container with per-collection subcontainers
`kellermeister/{cellars,bottles,products,orders}/`. Each subcontainer maps 1:1 to a sweep collection, keeping the sync sweep a table iteration and the layout human-discoverable. The container base is resolved from the WebID's `pim:storage` (provisioned if missing).
*Open refinement:* full Solid Type Index registration instead of the conventional path.

### D5 — Keep pragmatic Active Record; adopt the "apply-onto-tracked-model" discipline
Kellermeister already uses Soukai models *as* domain objects (`SoukaiCellar implements Cellar`). We keep this rather than introducing the prototype's purist entity⇄model mappers — the refactor cost is not justified for a single-user app. The one discipline we adopt from the prototype (its D3): **on update, load the existing tracked model and apply changed fields onto it — never reconstruct a fresh model** — because a fresh model discards the CRDT operation log that `synchronize()` depends on.
*Alternative rejected:* full purist mapping (plain entities + mappers). Deferred; can be layered in later without changing the sync design.

### D6 — CRDT-ready models via `timestamps` + `history` + soft deletes
The four root models enable `timestamps: true`, `history: true`, and `useSoftDeletes(true)`. `history` produces the operation log `synchronize()` replays; soft deletes make `delete()` retain the record (marked `deletedAt`) so deletions are visible to the sweep and propagate across devices; `findAll`/`findById` filter soft-deleted records so the UI never shows them. **No migration** — existing Pod data is out of scope, so we are free to write the new shape from the first sync.

### D7 — Provisional identity + well-known slugs + idempotent deterministic re-home
Entities created offline are born with a provisional `local://<collection>/<uuid>#it` id. The two well-known cellars use fixed slugs instead of a uuid: `local://cellars/altglass#it` and `local://cellars/cellarwork#it`. On first sync after login each resource is **re-homed** to `<collectionContainer><slug>#it`, derived deterministically from the same slug. Determinism makes re-home idempotent — a retried/interrupted sync recomputes identical URLs and never creates duplicates. A provisional resource soft-deleted before it ever synced is purged locally (`forceDelete`) — nothing reaches the Pod.
*Rejected:* a permanent local key with the Pod URL derived only at sync time (local url ≠ remote url forever) — breaks soukai-solid's URL-based `synchronize()`.

### D8 — Cross-resource reference rewriting at re-home
Kellermeister resources reference one another by URL. When resources re-home independently, a reference stored as `local://…` would dangle. Because every Pod URL is a pure function of `(collectionContainer, slug)`, re-home rewrites every `local://` reference field to its derived Pod URL with **no lookup table**. Reference fields to rewrite: `Bottle.productUrl`, `Bottle.cellarUrl`, `OrderItem.productUrl`, `OrderItem.orderUrl` (intra-document — no rewrite when embedded), `Order.sellerUrl` (embedded), `Product.orderItemUrl`. The rewrite is pure and idempotent (a value already on an `https://` URL is left untouched).

### D9 — Generic sweep over a collection registry
`SolidSyncService` is generalized to iterate a registry of `{ model, container, refFields }`. For each collection it unions local + remote by URL: both-present → `Model.synchronize(local, remote)` then persist both (this is the deletion path across devices); local-only & live → CREATE on the Pod; remote-only & live → CREATE locally. "4 collections vs 3" is thus a table length, not additional code.

### D10 — Single-flight `SyncCoordinator` for on-reconnect + manual triggers
Both triggers funnel into one coordinator that (a) runs at most one sync at a time, (b) coalesces triggers fired mid-sync into a single follow-up run, (c) guards on a valid session — on-reconnect without a session is skipped silently; manual surfaces a `NotAuthenticatedError` so the UI can prompt login. State machine: `idle → syncing → idle`, with `error` on failure; retry/backoff only on the on-reconnect path.

## Risks / Trade-offs

- **Reconstructing models on update destroys CRDT history** → enforce D5 (apply-onto-tracked-model); cover with a test asserting the operation log grows across updates rather than resetting.
- **Dangling references after independent re-home** → D8 rewrite pass; cover with a test that a Bottle synced before its Product still resolves to the Product's Pod URL, and that re-running re-home produces no duplicates.
- **`navigator.onLine` is unreliable** → treat reconnect as a hint; always try-and-fail gracefully and surface errors via the sync-status store.
- **LWW silently drops a losing concurrent edit** → acceptable for single-user; documented hard boundary. Multi-user would require revisiting D6's merge strategy.
- **Container sweep is O(all data) per sync** → acceptable at single-user scale (D9); flagged for outbox evolution.
- **soukai-solid API maturity / churn** → isolate all soukai-solid usage inside infrastructure adapters.
- **OIDC redirect disrupts SPA state** → restore session on load before mounting sync; unsynced local writes stay durable in IndexedDB across the redirect.

## Open Questions

- Full Solid **Type Index** registration vs. the conventional `pim:storage` + `kellermeister/` path (D4).
- Backoff policy specifics (interval, max attempts) for on-reconnect retries.
- How the order-ingestion use case behaves offline (an order arriving via the Pod inbox has no offline analogue) — may narrow `Order`'s create-before-login scope.
