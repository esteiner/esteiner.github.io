## Context

Before the local-first migration, `SoukaiOrderRepository` was constructed with a `storageUrl` and read unprocessed orders directly from the Pod: `SoukaiOrder.from('{storageUrl}inbox/kellermeister/').all()`. The migration made all repositories local-only (IndexedDB) with a `podBase: () => string | null` accessor, and stubbed `fetchUnprocessedOrders()` to `return []` — deferring inbox ingestion as an "open question." As a result, `KellermeisterService.ingestOrdersFromInbox()` (triggered from `cellarwork-page`'s `_bottlesTask` when logged in) always sees zero orders.

The local-first architecture already has a proven pattern for reaching the Pod: `SolidSyncService` runs Soukai queries against the Pod with `withEngine(new SolidEngine(session.fetch), () => Model.from(container).all())`, obtaining the session from `AuthService.getSession()` (`{isLoggedIn, webId, fetch}`). The inbox is exactly such a Pod resource, so inbox reads should use the same mechanism rather than the global IndexedDB engine.

Two concrete defects to fix:
1. `fetchUnprocessedOrders()` returns `[]` (the feature's proximate cause).
2. `KellermeisterService.moveProcessedOrder` deletes the source via `deleteSolidDataset(url, {fetch: fetch})` using the **global** `fetch`, which is unauthenticated and would fail against the Pod. This also leaks an infra import (`deleteSolidDataset`) into the application layer.

The inbox container is a sibling of the Kellermeister base: base `https://alice.pod/kellermeister/` ⇒ storage root `https://alice.pod/` ⇒ inbox `https://alice.pod/inbox/kellermeister/`.

## Goals / Non-Goals

**Goals:**
- Restore reading + ingesting unprocessed orders from `{storageRoot}inbox/kellermeister/` when the cellarwork page opens for a logged-in user.
- Use the authenticated Solid engine for both the inbox read and the inbox source deletion.
- Keep Pod-inbox access inside the repository layer; remove the `deleteSolidDataset` usage/import from `KellermeisterService`.
- Fail soft when offline / not logged in (return no unprocessed orders).

**Non-Goals:**
- Offline order ingestion (the inbox is inherently a Pod resource; nothing to ingest offline).
- Changing how processed orders sync to the Pod (the existing re-home/sweep already carries the locally-saved processed order).
- Reworking the cellarwork page UI or the per-item product/bottle creation logic in `addBottles` (unchanged).
- Using the WebID-declared `ldp:inbox`; the fixed `{storageRoot}inbox/kellermeister/` path is used (matches the original behavior).

## Decisions

### Decision 1: Read the inbox via the authenticated Solid engine
Implement `fetchUnprocessedOrders()` as: obtain the session from an injected `AuthService`; if not logged in or no inbox URL, return `[]`; otherwise `withEngine(new SolidEngine(session.fetch), () => SoukaiOrder.from(inboxUrl).all())`, then load the `seller` and `positions` relations on each order (mirroring `fetchOrders`).

- **Why:** identical to `SolidSyncService`'s Pod-access pattern — one consistent way to reach the Pod, no new abstraction.
- **Alternative considered:** inject a `SyncService`/engine factory. Rejected as heavier than constructing a `SolidEngine` from the session, which the sync service also does inline.

### Decision 2: Derive the inbox URL from the resolved Pod base
Add an `inboxContainer(): string | null` to `PodContainerRegistry` that returns `{storageRoot}inbox/kellermeister/`, deriving the storage root by stripping the trailing `kellermeister/` from the base (null if the base is unresolved). Inject this into `SoukaiOrderRepository` as an `inboxContainer: () => string | null` accessor, consistent with the existing `podBase` closure style.

- **Why:** the base is the single source of truth for Pod location and is already persisted in the registry; deriving keeps one place that knows the layout.
- **Alternative considered:** thread the raw `storageRoot` from `landing-page` into a new registry field. Rejected — the base already encodes it; a derivation avoids a second stored value that could drift.

### Decision 3: Move inbox deletion into the repository
Add `deleteFromInbox(order: Order): Promise<void>` (or `removeProcessedOrderSource`) to `OrderRepository`, implemented in `SoukaiOrderRepository` using `deleteSolidDataset(sourceDocumentUrl, {fetch: session.fetch})`. `KellermeisterService.moveProcessedOrder` calls this instead of importing `deleteSolidDataset` directly.

- **Why:** the repository already owns Pod-inbox access and holds the `AuthService`; this fixes the unauthenticated-fetch bug and removes an infrastructure dependency from the application layer (clean-architecture alignment).
- **Alternative considered:** inject `AuthService` into `KellermeisterService` and keep the delete there. Rejected — pushes Pod/RDF concerns up into the application layer.

### Decision 4: Wiring in CDI
`CDI` constructs `SoukaiOrderRepository(podBase)` today. Change to inject the existing `authService` and an inbox accessor built from the registry: `new SoukaiOrderRepository(podBase, () => this.containers.inboxContainer(), this.authService)`.

## Risks / Trade-offs

- **[Inbox read runs on the render path (cellarwork `_bottlesTask`) and can be slow or fail]** → It is already gated on `isLoggedIn`; `fetchUnprocessedOrders` fails soft (returns `[]`) when offline. Wrap the ingestion trigger so a network error surfaces without blocking display of existing cellarwork contents.
- **[Deleting the inbox source is destructive and irreversible]** → Delete only after the processed order has been saved locally; deletion uses the authenticated fetch so it actually succeeds (previously it silently failed). Matches the confirmed intended behavior.
- **[Storage-root derivation by stripping `kellermeister/` is string surgery]** → The base is always `{storageRoot}kellermeister/` (set by `resolveKellermeisterContainer`); centralizing the derivation in `PodContainerRegistry.inboxContainer()` keeps it in one tested place.
- **[Partial failure mid-batch (some orders ingested, one delete fails)]** → Each order is ingested then its source deleted individually; a failure leaves already-processed orders done and the failing one still in the inbox (retried next visit). Idempotency of re-ingestion is bounded by successful deletion.

## Migration Plan

Code-only. No local data migration. On the first logged-in cellarwork open after this change, any orders sitting in the inbox are ingested and cleared. Rollback reverts to the stubbed behavior (feature disabled again); no persisted data is corrupted.

## Open Questions

None — inbox location (fixed `{storageRoot}inbox/kellermeister/`) and post-ingest handling (save locally + delete source) were confirmed with the user.
