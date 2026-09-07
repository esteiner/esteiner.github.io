## 1. Measure first (establish the real problem)

- [x] 1.1 Instrumented e2e test against the local CSS (port 3001) counting Pod HTTP requests for a no-op sync (sync twice; measure the later runs). **Result (surprising):** a steady-state no-op sync is only **7** Pod requests — 4 container GETs + **2 document GETs (always `cellars/cellarwork` + `cellars/altglass`)** + 1 `GET /edwin/profile/card`; **0** GETs for all 838 bottles / products / orders / 3 regular cellars. The per-document last-modified skip ALREADY works; the change's original premise (hundreds of redundant GETs every sync) is disproven. Test: `e2e/specs/sync-requests.spec.ts`.
- [x] 1.2 Establish the real source of the "2000+ requests": confirmed with the user to be a **corrupted local browser store** (clearing IndexedDB + localStorage dropped it to ~14, then steady-state ~7) — all documents' baselines were invalid, so all were re-pulled. Not a persistent logic flaw; not addressed by container last-modified checks.
- [x] 1.3 Confirm CSS 7.2.0 container `dc:modified` semantics. **Result:** the container's own `dc:modified` bumps on member add/remove only, NOT on in-place child edits; the listing always carries each child's current `dc:modified`. One container GET is sufficient to detect all changes; a HEAD-only gate is unsafe. Recorded in `design.md`.

## 2. Fix the well-known-cellar convergence bug

- [x] 2.1 Root-cause the two well-known cellars: created locally (offline-first) *and* seeded on the Pod → soukai-bis `Sync` takes its document-merge path, which writes local `lastModifiedAt` back as an estimate (~sync time) that never equals the Pod's `dc:modified`, so `skipDocumentPull` never skips them. Verified content is identical (no value conflict).
- [x] 2.2 Add `SolidSyncService.reconcileWellKnownCellarBaselines`: once per session, after `Sync.run`, read the `cellars/` container and align `cellarwork` / `altglass` local `lastModifiedAt` to the Pod's `dc:modified` via `localEngine.updateDocument(url, [], { lastModifiedAt })`. Idempotent, best-effort, remote engine built once and shared.

## 3. Regression guard

- [x] 3.1 `e2e/specs/sync-requests.spec.ts` measures a no-op sync's Pod traffic (bracketed by the coordinator's console lines) and asserts **zero** per-document GETs and zero writes — catching both a well-known-cellar regression and a future corrupt-state / mass-refetch blow-up.

## 4. Verify

- [x] 4.1 e2e: no-op sync drops from 7 → **5** Pod requests (4 container GETs + 1 profile GET, **0** document GETs); stable across syncs #2 and #3. Assertions green.
- [x] 4.2 `npm run build` green (tsc + vitest unit tests + vite build). No regressions in existing sync/unit tests.
- [x] 4.3 Ran the full e2e suite (`npm run test:e2e`). **2 pass** — `cellar-huette` (login → sync → Pod data loads) and `sync-requests` (no-op sync = 5 requests, 0 document GETs). **1 fail — `inbox-ingestion`, but PRE-EXISTING**: it fails identically on unmodified `master` HEAD (verified by stashing this change and re-running), so it is unrelated to this change. Likely fallout from the recent inbox test-data / CORS migration commits; out of scope here.
