# Tasks

## 1. Engine inversion & DI
- [x] 1.1 In `main.ts`, replace the global `SolidEngine` with `IndexedDBEngine`; keep `bootSolidModels()`. Remove the pre-login engine dependency on the authenticated fetch.
- [x] 1.2 Refactor `CDI` so repositories and `KellermeisterService` are constructed at startup without a `storageUrl`; remove the `setStorageUrl()` gate (repositories become local-only).
- [x] 1.3 Update `landing-page.ts` so a successful login triggers `SyncCoordinator.requestSync('reconnect')` instead of calling `setStorageUrl()` as a precondition.

## 2. Resource identity
- [x] 2.1 Add identity helpers: `mintProvisional(collection)`, well-known slugs for `altglass`/`cellarwork`, `isProvisional`, `isPodUrl`, and a pure `podUrl(container, slug)` derivation.
- [x] 2.2 Update repositories to mint provisional `local://…` identities on create (including the two well-known cellars) instead of Pod-derived URLs.

## 3. Per-resource models
- [x] 3.1 Make `Bottle`, `Product`, `Order` their own resources; drop `SoukaiBottlesDocument` as the aggregate root. Keep `Rating` embedded in `Product` and `OrderItem` + `Seller` embedded in `Order` (retain `usingSameDocument` only for those).
- [x] 3.2 Enable `timestamps: true`, `history: true`, and `useSoftDeletes(true)` on `Cellar`, `Bottle`, `Product`, `Order`.
- [x] 3.3 Ensure reads (`findAll`/`findById` equivalents) filter soft-deleted records; ensure updates apply changed fields onto the loaded tracked model (never reconstruct) to preserve operation history.

## 4. Sync layer
- [x] 4.1 Define application ports `AuthService` and `SyncService`, and the `SynchronizeWithPod` use case.
- [x] 4.2 Implement `SyncCoordinator` (single-flight, coalescing, session guard, status listeners).
- [x] 4.3 Implement `SolidSyncService`: generic sweep over a `{ model, container, refFields }` registry for the four collections (pull → merge → push).
- [x] 4.4 Implement the re-home phase: migrate provisional resources to derived Pod URLs, purge unsynced provisional deletions, and rewrite `local://` reference fields (`productUrl`, `cellarUrl`, `orderItemUrl`, …) — idempotently.
- [x] 4.5 Implement Pod container resolution (`pim:storage` + `kellermeister/{cellars,bottles,products,orders}/`, provisioned if missing).
- [x] 4.6 Implement `ConnectivityMonitor` and wire on-reconnect + retry/backoff into the coordinator.

## 5. UI & wiring
- [x] 5.1 Expose sync status (`idle`/`syncing`/`error`, last-synced time) via the reactive store and render it.
- [x] 5.2 Add a manual "sync now" action.

## 6. Verification
- [x] 6.1 Test: create/read cellars & bottles fully offline (no session, no network).
- [x] 6.2 Test: operation log grows on update (history preserved), not reset.
- [x] 6.3 Test: re-home is idempotent and rewrites cross-resource references (bottle→product, bottle→cellar) to valid Pod URLs.
- [x] 6.4 Test: cross-device deletion propagates and is not resurrected.
- [x] 6.5 Test: single-flight coordinator coalesces overlapping triggers into one follow-up run.
