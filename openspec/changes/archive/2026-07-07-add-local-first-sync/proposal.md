## Why

Today Kellermeister is **Pod-first**: the global Soukai engine is the `SolidEngine`, and `CDI` cannot build any repository until a `storageUrl` has been resolved from the user's WebID *after login* (`landing-page.ts` → `CDI.setStorageUrl()`). A user therefore cannot create a single cellar or bottle without first authenticating against a Solid Identity Provider, and every read/write blocks on the network.

We want a **local-first** app: a user installs it, immediately creates cellars and bottles offline (stored in IndexedDB), and — only if and when they log in — their data is synced to their own Solid Pod. This is the pattern proven out in the sibling prototype `solid-local-first-recipes`, which uses the identical stack (`soukai` + `soukai-solid` + Lit + Vite). This change adapts that pattern to Kellermeister's richer, multi-aggregate domain.

## What Changes

- **Invert the engine.** The global default Soukai engine becomes `IndexedDBEngine` (all ordinary reads/writes are local and offline-capable). The Pod is reached **only** inside the synchronization layer via a scoped `withEngine(SolidEngine, …)`. `CDI` builds repositories without a `storageUrl`; login is no longer a precondition for using the app.
- **Per-resource data model.** The current single-document aggregates (`bottles.ttl` holding all bottles, `usingSameDocument(true)` throughout) are replaced by **independently-addressable resources**. Synced roots: `Cellar`, `Bottle`, `Product`, `Order`. Owned children stay embedded: `Rating` in `Product`; `OrderItem` and `Seller` in `Order`. Pod layout: a `kellermeister/` container with `cellars/`, `bottles/`, `products/`, `orders/` subcontainers.
- **Provisional identity + idempotent re-home.** Entities created offline are born with a provisional `local://<collection>/<uuid>#it` identity. The two well-known cellars (`Altglass`, `Eingang`/cellarwork) get well-known slugs (`local://cellars/altglass#it`, `local://cellars/cellarwork#it`). On first sync after login, each resource is **re-homed** to a Pod URL derived deterministically from the same slug, making re-home idempotent.
- **Cross-resource reference rewriting.** Because resources reference each other by URL (`Bottle.productUrl`, `Bottle.cellarUrl`, `OrderItem.productUrl`, `Product.orderItemUrl`), re-home rewrites every `local://` reference field to its deterministically-derived Pod URL — a pure, idempotent transform requiring no lookup table.
- **CRDT-ready models.** Enable `timestamps: true`, `history: true`, and `useSoftDeletes(true)` on the four root models so `SolidModel.synchronize()` (LWW-per-property via HLC) and cross-device soft-delete propagation work. **No migration** of existing Pod data is required.
- **Synchronization layer.** A single-flight `SyncCoordinator` (coalesces overlapping triggers, guards on session) drives a `SynchronizeWithPod` use case delegating to a `SolidSyncService` that sweeps the four collections (pull → merge → push). Triggers: on-reconnect (`ConnectivityMonitor`) and manual. Application-level ports `AuthService` and `SyncService`.
- **Sync-status UI.** Surface `idle` / `syncing` / `error` and last-successful-sync time; the post-login flow triggers `requestSync('reconnect')` instead of gating the app on `setStorageUrl()`.

## Non-Goals

- Real-time / multi-user collaborative editing. LWW-per-property is correct for a single author across devices and is a documented hard boundary.
- A dirty-set/outbox sync optimization — start with a container sweep over the four collections.
- Migration of existing Pod data written under the old single-document layout.
- Server-side components — the app stays a static SPA; the Pod is the only backend.

## Capabilities

### New Capabilities
- `local-persistence`: Offline-first persistence of Kellermeister aggregates to IndexedDB via Soukai, with the Pod reachable only through the sync layer.
- `pod-synchronization`: Reconciling local state with the Solid Pod via soukai-solid — trigger orchestration (on-reconnect + manual), single-flight coordination, LWW conflict handling, cross-device deletion, and sync-status reporting.
- `resource-identity`: Provisional local identities, well-known cellar slugs, deterministic idempotent re-home, and cross-resource reference rewriting across the local→Pod boundary.

## Impact

- **Affected code**: `main.ts` (engine inversion), `CDI` (storageUrl no longer required), all `Soukai*Repository` classes (local-only, provisional identities), all `Soukai*` models + schemas (CRDT flags, drop/keep `usingSameDocument`), `landing-page.ts` (login triggers sync, not gating), `KellermeisterService` (unchanged interface; runs offline).
- **New code**: `application/sync/` (`SyncCoordinator`, `SynchronizeWithPod`, ports `AuthService`/`SyncService`), `infrastructure/solid/` (`SolidSyncService`, `ConnectivityMonitor`, container resolution), `infrastructure/shared/` identity helpers.
- **Data model**: New per-resource Pod layout under `kellermeister/`. Old single-document data is **not** migrated (out of scope by decision).
- **Runtime**: App becomes fully usable with no login; requires a modern browser with IndexedDB. A Solid Pod is required only for sync.
