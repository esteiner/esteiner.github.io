## Context

Sync is delegated to soukai-bis `Sync.run` from `SolidSyncService.synchronize()`: (1) a local-only re-home (`MigrateLocalUrls`, no Pod requests), then (2) `Sync.run`, which reconciles whole documents between the local `IndexedDBEngine` and the Pod `SolidEngine`.

Measurement drove this design (see tasks 1.1 / 1.3). Against the real stack (CSS 7.2.0 on port 3001, real login, ~840-bottle seeded Pod), a steady-state no-op sync issues only:

- 4 container GETs (one listing per collection: `cellars/`, `products/`, `bottles/`, `orders/`),
- 2 document GETs — always `cellars/cellarwork` and `cellars/altglass`,
- 1 `GET /edwin/profile/card`.

All 838 bottles, all products, all orders, and the 3 regular cellars: 0 GETs. So bis `Sync`'s per-document skip already works: the container listing carries each child's `dc:modified` (verified — CSS emits it per child), `Container.resources` (a `belongsToMany(...).usingSameDocument()` relation) surfaces it as `updatedAt`, and `Sync.skipDocumentPull` compares it to the local `lastModifiedAt` and skips unchanged documents. The user's reported 2000+ requests were a corrupted local store (all documents missing a valid baseline → all re-pulled), resolved by clearing IndexedDB + localStorage.

The remaining waste is the two well-known cellars, and its cause is specific:

- They are created locally on every device by `ensureWellKnownCellars` (offline-first) with fixed slugs, then re-homed to Pod URLs (`{base}cellars/cellarwork`, `{base}cellars/altglass`) that already hold seeded copies with identical content but an independent operation history.
- So `Sync` takes the document-merge path (`syncDocumentContents`), not a clean pull. That path pushes nothing (writes=0) but computes the local `lastModifiedAt` from `getDocumentLastModifiedAt(start, end, null)` — an estimate ≈ sync time (because the remote update returns no response when there is nothing to push).
- That estimate never equals the Pod's `dc:modified`, so `skipDocumentPull` never skips them and they are re-pulled (and re-merged, re-estimated) on every subsequent sync.

Constraints: `SolidEngine` rejects caller-supplied metadata (the server owns modified dates); bis `Sync` internals are not ours to fork; the local `IndexedDBEngine` does persist and index `lastModifiedAt` and exposes `getDocumentsLastModifiedAt()` / `updateDocument(url, [], { lastModifiedAt })`.

## Goals / Non-Goals

**Goals:**
- A no-op sync makes zero per-document Pod GETs (the well-known cellars converge and are skipped like every other unchanged document).
- The fix is minimal, local to the sync layer, idempotent, and best-effort (a failure never makes sync worse).
- A regression guard measures a no-op sync's request volume so a future corrupt-state blow-up or well-known-cellar regression is caught.

**Non-Goals:**
- Forking or patching soukai-bis `Sync` internals.
- The broad container-gate / baseline-persistence-for-all-collections work originally proposed (measurement showed it is unnecessary — the skip already works).
- Eliminating the first/after-wipe full pull (inherent: content isn't in the listing; nothing local to compare against yet).
- Self-healing an already-corrupted local store (the regression guard mitigates recurrence instead).

## Decisions

### Decision 1: Reconcile the well-known cellars' local baseline to the Pod's `dc:modified`, once per session
After `Sync.run`, read the `cellars/` container once, and for `cellarwork` / `altglass` write the Pod's `dc:modified` (from the listing) as the local `lastModifiedAt` via `localEngine.updateDocument(url, [], { lastModifiedAt })`. On the next sync, `skipDocumentPull` sees an exact match and skips them; the merge path (and its re-estimate) no longer runs, so they stay converged. Guarded by an instance flag so it runs at most once per app session (the login sync), adding no per-sync overhead thereafter.
- **Why the container listing (not a `HEAD`):** `Sync` compares against the listing's millisecond-precision `dc:modified`; using the same source guarantees an exact match. A `HEAD`'s second-precision `Last-Modified` would only match within tolerance.
- **Alternative considered — reconcile every sync:** simpler (no flag) but adds a redundant cellars-container GET after convergence (when `Sync` already skips them). Rejected in favour of once-per-session.
- **Alternative considered — stop creating well-known cellars locally / delete-and-repull:** deletion propagates as a tombstone (would delete them on the Pod), and removing eager local creation regresses offline-first. Rejected.
- **Alternative considered — raise `lastModifiedTolerance`:** the estimate differs from the Pod value by months, far beyond any sane tolerance. Rejected.

### Decision 2: Ship an instrumented request-count regression test
`e2e/specs/sync-requests.spec.ts` logs in (first full sync), then measures syncs #2 and #3 bracketed by the coordinator's own console lines, classifies Pod traffic (container GETs / document GETs / writes / other), and asserts a no-op sync makes zero document GETs and no writes. This is the guard that would have flagged both the well-known-cellar leak and the 2000-request corrupt-state blow-up.

## Risks / Trade-offs

- **Reconciliation writes a wrong baseline and hides a real change** → it only ever copies the Pod's own `dc:modified` for the two fixed well-known slugs onto the matching local document; it never suppresses a fetch for any other document, and content is untouched. Worst case degrades to the prior re-fetch behaviour.
- **The cellars container read costs one request per session** → bounded to once per `SolidSyncService` instance (the login sync); steady-state syncs add nothing and save the two per-sync document GETs plus the merge/local-write churn.
- **A well-known cellar not present locally** → `updateDocument` throws `DocumentNotFound`; caught and skipped (nothing to align).

## Migration Plan

- Additive to sync bookkeeping; no schema or data migration (baselines live in the existing IndexedDB documents' `lastModifiedAt`).
- **Rollback:** revert `SolidSyncService`; behaviour returns to the prior (correct but chatty) two-GET-per-sync well-known-cellar handling. The e2e test can stay as documentation of expected volume.

## Open Questions

- **RESOLVED** — Does CSS 7.2.0 bump a container's own `dc:modified` on an in-place child edit? **No** (task 1.3, probed against `file-root.json`): a member add/remove bumps the container's own `dc:modified`; an in-place child edit does not, but updates that child's `dc:modified` in the container listing. So a single container GET is sufficient to detect all changes, and a `HEAD`/container-own-date gate would be unsafe — which is why Decision 1 reads the listing.
- Should the underlying corrupt-state cause (how a store ends up with all baselines invalid) be investigated and self-healed? Deferred — mitigated by the regression guard; revisit if it recurs.
