## Context

Kellermeister is local-first: repositories are constructed eagerly at startup and are local-only (IndexedDB). No `storageUrl` is required to use the app; the Pod container base is resolved lazily after login via `setPodContainerBase`, and the sync layer is the only path that reaches the Pod. Every syncable resource is born with a provisional `local://<collection>/<slug>#it` identity and is re-homed to a deterministic Pod URL on first sync.

Two cellars are special: `cellarwork` (the intake cellar, "Eingang") and `altglass` (returned glass). The identity scheme for them already exists — `WELL_KNOWN_CELLAR` in `resource-identity.ts` defines their fixed slugs, and `SoukaiCellarRepository` already has `createCellarForCellarwork`/`createCellarForAltglass`, `getCellarWorkId`/`getAltglassId`, and `wellKnownId(slug)`. What is missing is a *guarantee* that they always exist: today they are only materialized lazily, when `fetchCellarForCellarwork`/`fetchCellarForAltglass` or a matching `fetchCellarById` is called.

The user asked for automatic creation tied to `resolveKellermeisterContainer`, and — after discussion — chose a "both" approach: create at startup (honoring local-first) and re-verify during container resolution.

Relevant current facts:
- `resolveKellermeisterContainer(storageRoot, authenticatedFetch)` lives in the Solid layer and provisions raw Pod containers; it has no repository access today.
- `SoukaiCellarRepository` is constructed in `CDI` with a `podBase` accessor and boots the Soukai model in its constructor.
- The existing `create*` methods are **not** idempotent: `new SoukaiCellar({url}).save()` with a fixed url can create a second document / overwrite, so an "ensure" wrapper is needed.

## Goals / Non-Goals

**Goals:**
- Both well-known cellars always exist and appear in the cellar list, with or without a login.
- Creation is idempotent: repeated ensuring never duplicates and never clobbers a user-edited cellar (e.g. renamed display name).
- Fixed slugs (`cellarwork`, `altglass`) are preserved so re-home/sync is deterministic.
- Keep the Solid layer (`podContainerResolution.ts`) decoupled from Soukai/IndexedDB details.

**Non-Goals:**
- No change to the identity scheme, re-home logic, or sync layer.
- No migration of existing lazily-created well-known cellars (they already resolve to the same fixed slug URLs).
- No new UI. Display names/order remain as currently defined ("Eingang" / "Altglass", `displayOrder: -1`).

## Decisions

### Decision 1: Add an idempotent `ensureWellKnownCellars()` to the repository
Add a single method `ensureWellKnownCellars(): Promise<void>` to `CellarRepository` (domain interface) implemented in `SoukaiCellarRepository`. It ensures both cellars via an internal idempotent helper `ensureCellar(id, name, displayOrder)` that: fetches existing cellars, returns the match if the fixed-slug id is already present, and otherwise creates it.

- **Why a repository method:** cellar existence is a repository concern; keeping it there lets both startup and container-resolution reuse one idempotent primitive.
- **Alternative considered:** make the existing `createCellarFor*` methods idempotent in place. Rejected because their names imply unconditional creation and other call sites (fetch fallbacks) rely on create semantics; a distinct `ensure*` primitive is clearer. The `createCellarFor*` methods can delegate to the ensure helper to remove the current duplicate risk.

### Decision 2: Ensure at startup during repository construction
Trigger `ensureWellKnownCellars()` as part of local repository initialization so the cellars exist before any login. Since the constructor cannot `await`, kick off the ensure as a fire-and-forget promise stored on the repository (e.g. `this.ready`), and have read paths that must see them (`fetchCellars`) await `this.ready` first. This keeps the synchronous `CDI` constructor unchanged.

- **Alternative considered:** an explicit async `init()` called from `CDI`/`main.ts`. Rejected to avoid changing the eager, synchronous DI wiring; a `ready` promise awaited by reads is simpler and race-free.

### Decision 3: Re-verify at container resolution via an injected callback
Extend `resolveKellermeisterContainer` to accept an `ensureWellKnownCellars` callback (a `() => Promise<void>`), invoked after the subfolders are provisioned. The caller (`landing-page`, via `CDI`) passes `cellarRepository.ensureWellKnownCellars`. This honors the request ("created when the subfolders are created in `resolveKellermeisterContainer`") without coupling the Solid layer to Soukai.

- **Alternative considered:** inject the whole `CellarRepository` into the Solid function. Rejected — a narrow callback keeps the dependency minimal and testable. Making the parameter optional keeps existing tests of the pure container logic working.

### Decision 4: Idempotency keyed on the effective fixed-slug id
`ensureCellar` compares against `getCellarWorkId()`/`getAltglassId()`, which return the provisional `local://cellars/<slug>#it` before login and the derived Pod URL after. Existence is checked by scanning `fetchCellars()` for a matching `getId()`. Because the slug is stable and re-home is deterministic, the pre- and post-login ids refer to the same resource, so no duplicate is created across the login boundary.

## Risks / Trade-offs

- **[Constructor fire-and-forget ensure races with early reads]** → `fetchCellars()` (and other read paths that must observe the well-known cellars) await the stored `ready` promise before querying, making the ordering deterministic.
- **[Duplicate created across the login boundary if id comparison is by URL string only]** → Idempotency keys on the fixed slug via `getCellarWorkId()`/`getAltglassId()`, whose values track the current base; re-home maps provisional→Pod for the same slug deterministically, so the same logical cellar is recognized.
- **[Re-verification overwrites a user-renamed well-known cellar]** → `ensureCellar` is strictly create-if-absent; when the cellar exists it is returned untouched, preserving any renamed display name.
- **[Coupling the Solid layer to repositories]** → Avoided by passing a narrow `() => Promise<void>` callback rather than the repository itself; the callback is optional so pure container-resolution tests are unaffected.

## Migration Plan

No data migration required. Existing well-known cellars already use the fixed slugs and resolve to the same URLs, so they satisfy the ensure check and are left untouched. Rollback is code-only (revert the ensure wiring); persisted cellars are unaffected.

## Open Questions

None outstanding — placement (startup + container-resolution re-verify) was confirmed with the user.
