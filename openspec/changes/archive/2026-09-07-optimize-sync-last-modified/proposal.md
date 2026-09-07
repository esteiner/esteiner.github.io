## Why

A sync between the local IndexedDB and the Pod appeared to fire far too many HTTP requests (2000+ for a Pod with ~840 bottles, even when nothing had changed). Instrumented measurement against the real stack (CSS on port 3001, real login, seeded Pod) reframed the problem:

- **The acute 2000-request blow-up was corrupted local browser state, not a flaw in the sync logic.** Clearing IndexedDB + localStorage and re-syncing dropped it to ~14 requests, then to a steady state of **~7 per no-op sync**. The failure mode: when documents exist locally but their `lastModifiedAt` baseline is missing/invalid, `Sync.skipDocumentPull` can't match and every document is re-pulled — in a corrupt state that applied to all ~840 documents.
- **In a healthy store the per-document last-modified skip already works.** A no-op sync issues 4 container listings + 1 profile fetch and skips all 838 bottles / products / orders / regular cellars — 0 document GETs. "Check the container's last-modified first" is, in effect, already implemented (the container listing carries each child's `dc:modified`) and effective.
- **One real, narrow bug remains:** the two *well-known* cellars (`cellarwork`, `altglass`) are re-fetched on **every** sync forever. They are created locally on every device (for offline-first) *and* already exist on the Pod, so soukai-bis's `Sync` takes its document-merge path for them. That path pushes nothing but writes the local `lastModifiedAt` back as an estimate (~sync time) that never equals the Pod's `dc:modified`, so they can never be skipped. Regular resources avoid this because they are pulled remote-only and inherit the Pod's real last-modified.

This change fixes that narrow, verified waste and adds a regression guard so a future corrupt-state blow-up (or a well-known-cellar regression) is caught early. The broad "container gate + baseline persistence across all collections" originally proposed here is **not warranted** — the measurement disproved its premise.

## What Changes

- **Well-known cellar convergence fix:** once per session, after a sync, align the local `lastModifiedAt` of `cellarwork` / `altglass` to the Pod's actual `dc:modified` (read from the cellars container listing — the same millisecond-precision value `Sync` compares against), so subsequent syncs skip them. Idempotent and best-effort.
- **Regression guard:** an instrumented e2e test (`e2e/specs/sync-requests.spec.ts`) that logs in, then measures a no-op sync's Pod traffic and asserts it makes **zero** per-document GETs and no writes — catching both a well-known-cellar regression and a future corrupt-state / mass-refetch regression.

## Capabilities

### New Capabilities
<!-- None; this refines existing sync behavior. -->

### Modified Capabilities
- `pod-synchronization`: a no-op sync SHALL make no per-document Pod fetches; specifically, the well-known cellars SHALL converge and not be re-fetched on every sync.

## Impact

- **Code**: `src/infrastructure/solid/SolidSyncService.ts` — new `reconcileWellKnownCellarBaselines` step after `Sync.run`, guarded by a once-per-session flag; the remote engine is now built once and shared. No change to domain, application, or web layers.
- **Tests**: new `e2e/specs/sync-requests.spec.ts` (request-count regression guard). Existing unit tests and the full build remain green.
- **Behaviour**: steady-state no-op sync drops from 7 to 5 Pod requests (4 container listings + 1 profile fetch, 0 document GETs); the well-known cellars stop re-fetching and stop churning local writes.
- **Not addressed** (out of scope, understood): the first/after-wipe full pull that populates an empty local store is inherent (the listing carries dates, not content) and is not a last-modified problem; the underlying corrupt-state cause is mitigated by the regression guard rather than a self-heal.
