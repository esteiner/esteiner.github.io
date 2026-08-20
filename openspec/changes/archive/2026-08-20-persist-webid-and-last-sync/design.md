## Context

- **Last sync time** is held only in `SyncCoordinator.status.lastSyncedAt` and set to `new Date()` on a successful `run()` (SyncCoordinator.ts:68). It is never persisted, so a reload shows "Nur lokal" until the next sync. Profile and landing pages subscribe via `onStatusChange`.
- **WebID** comes from the live Solid session (`AuthService.getSession().webId` / `session.info.webId`). It is not stored locally; landing-page's `sessionChangedCallback` handles LOGIN/SESSION_RESTORED and already has the WebID in hand.
- **Local singletons today** (`PodContainerRegistry` base, landing-page WebID *history*) use `localStorage`. The only IndexedDB is soukai's `IndexedDBEngine("kellermeister")` for domain models. The request is specifically to use IndexedDB.
- Tests run under `fake-indexeddb`; `environment: 'node'`, no DOM.

## Goals / Non-Goals

**Goals:**
- Persist the WebID used and the last successful sync date in IndexedDB.
- Both survive a reload and are readable offline / before a session is restored.
- Seed the sync status from the persisted last-sync date at startup.

**Non-Goals:**
- Syncing this metadata to the Pod (it is local-only device state).
- Replacing the existing `localStorage` uses (Pod base, WebID history) — out of scope.
- A general preferences framework; just these two values (extensible later).

## Decisions

### Decision 1: A dedicated IndexedDB key-value store behind an application port
Add an application port `AppStateStore` with `getWebId()/setWebId(webId)` and `getLastSyncedAt()/setLastSyncedAt(date)`, and an infrastructure adapter `IndexedDbAppStateStore` using raw IndexedDB — a **separate database** (e.g. `kellermeister-appstate`) with one object store (e.g. `appState`) keyed by field name.

- **Why a separate DB, not soukai's `kellermeister` DB?** soukai owns that database's object stores and version; opening it and adding our own store would fight soukai's schema/upgrade handling. A small independent DB is isolated and simple.
- **Why raw IndexedDB, not a library?** No `idb`-style dependency exists; the surface is two get/set pairs. A ~30-line promise wrapper suffices and runs under `fake-indexeddb` in tests.
- **Why a port/adapter?** Matches the codebase's `AuthService`/repository style; keeps `SyncCoordinator` and pages depending on an interface, and keeps the store swappable/testable.
- **Alternatives considered:** (a) a soukai model kept out of the sync specs — rejected: RDF singletons need a URL/container and are awkward, and the model is built for Pod sync. (b) `localStorage` — rejected: the user asked for IndexedDB.

### Decision 2: One writer per value
- **WebID** is written in the session-established path (`sessionChangedCallback`, which fires on LOGIN and SESSION_RESTORED with a valid `webId`) via `appState.setWebId(webId)`. Single, natural choke point where the app first knows the authenticated WebID.
- **Last sync date** is written by `SyncCoordinator` in its success branch, right where it already sets `lastSyncedAt = new Date()`.

Keeping one writer per value avoids duplicate/contradictory writes and keeps responsibilities clear.

### Decision 3: Seed sync status from the store at startup
`SyncCoordinator` takes the `AppStateStore` and, on construction, kicks off an async load of the persisted last-sync date; when it resolves it sets `status.lastSyncedAt` and notifies listeners (so a reload shows the real time before any new sync). The write path persists on each successful run.

- **Why in `SyncCoordinator`?** It already owns sync status (read + notify + write), so both the persisted read and write live in one place.
- Profile page additionally reads `appState.getWebId()` for display, preferring the live session WebID and falling back to the stored one so it shows even with no session.
- **Alternative considered:** seed from CDI and pass into the coordinator — rejected as more wiring; the coordinator already owns status.

## Risks / Trade-offs

- **[Async seed races a fast first sync]** → Both paths only ever set `lastSyncedAt`; single-flight and the fact that a fresh successful sync produces a newer date make the last write correct. Seeding only sets it if still unset/older is a safe refinement.
- **[IndexedDB unavailable (private mode / SSR)]** → The adapter degrades gracefully: reads resolve `null`, writes no-op (mirrors `PodContainerRegistry`'s `typeof localStorage` guard), so the app keeps working without persistence.
- **[Date serialization]** → Store as an ISO string; parse back to `Date` on read (guard invalid/empty).
- **[Two IndexedDB databases now]** → Minor; isolation is worth it. Documented.

## Migration Plan

Additive and local-only; no schema migration for existing data. First run simply has no stored values (WebID/last-sync null) until the next login/sync populates them. Rollback drops the store and reverts to in-memory-only last-sync; no stored domain data is affected.

## Open Questions

None — storage mechanism (dedicated IndexedDB store), the two writers, and startup seeding are settled; the metadata is explicitly local-only.
