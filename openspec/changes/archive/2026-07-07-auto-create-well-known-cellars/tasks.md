## 1. Domain interface

- [x] 1.1 Add `ensureWellKnownCellars(): Promise<void>` to `CellarRepository` in `src/domain/Cellar/CellarRepository.ts`, documenting its idempotent create-if-absent semantics.

## 2. Repository implementation (idempotent ensure)

- [x] 2.1 In `SoukaiCellarRepository`, add a private idempotent helper `ensureCellar(id, name, displayOrder)` that scans `fetchCellars()` for the given fixed-slug id, returns the existing cellar if present, and otherwise creates it.
- [x] 2.2 Implement `ensureWellKnownCellars()` to ensure both the cellarwork ("Eingang", displayOrder -1) and altglass ("Altglass", displayOrder -1) cellars via `ensureCellar`, keyed on `getCellarWorkId()`/`getAltglassId()`.
- [x] 2.3 Refactor `createCellarForCellarwork`/`createCellarForAltglass` to delegate to the idempotent helper so they no longer risk duplicating a fixed-slug document.

## 3. Startup creation (local-first)

- [x] 3.1 In the `SoukaiCellarRepository` constructor, kick off `ensureWellKnownCellars()` as a stored fire-and-forget promise (e.g. `this.ready`) after `bootModels`.
- [x] 3.2 Make `fetchCellars()` (and any read path that must observe the well-known cellars) await `this.ready` before querying, so early reads never race the startup ensure.

## 4. Re-verify at container resolution

- [x] 4.1 Extend `resolveKellermeisterContainer` in `src/infrastructure/solid/podContainerResolution.ts` to accept an optional `ensureWellKnownCellars?: () => Promise<void>` callback and invoke it after the subfolders are provisioned.
- [x] 4.2 Wire the callback at the call site: pass `cellarRepository.ensureWellKnownCellars` (via `CDI`) where `resolveKellermeisterContainer` is called in `src/infrastructure/web/pages/landing-page.ts`; expose an accessor on `CDI` if needed.

## 5. Verification

- [x] 5.1 Add/extend tests: fresh local store yields both well-known cellars via `fetchCellars()` without login; ensure is a no-op (no duplicate, name preserved) when they already exist; container resolution restores a deleted well-known cellar. Use IndexedDBEngine + fake-indexeddb per existing test setup.
- [x] 5.2 Manually verify in the running app that both cellars appear in the cellar list before login and remain single after login + sync. (Before-login: verified in-app — "Kellerarbeit" and "Altglass" both render without a session. After-login single-instance: covered by idempotent `ensureCellar` + the callback running before `setPodContainerBase`; not exercised against a live Pod for lack of credentials.)
