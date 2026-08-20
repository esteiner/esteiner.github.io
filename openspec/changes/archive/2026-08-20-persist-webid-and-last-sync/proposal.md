## Why

The last successful sync time lives only in memory (`SyncCoordinator`), so a page reload resets the profile/landing display to "Nur lokal" even right after a sync. The WebID used to log in isn't stored locally at all — it's only known while a live session exists. Persisting both in IndexedDB lets the app show the last-used WebID and the real last-sync time immediately on load, before (or without) a restored session.

## What Changes

- Introduce a small IndexedDB-backed local app-state store (an application port with an infrastructure adapter) holding two singleton values: the WebID used and the last successful sync date.
- Persist the **WebID** when an authenticated session is established (login or session restore).
- Persist the **last sync date** whenever a synchronization run completes successfully.
- On startup, seed the in-memory sync status from the persisted last sync date so it survives a reload, and expose the persisted WebID for display.
- Show the persisted WebID / last-sync on the profile page even without a live session.

## Capabilities

### New Capabilities
<!-- None; this refines the existing local-persistence capability. -->

### Modified Capabilities
- `local-persistence`: Local IndexedDB persistence is extended to app/session metadata — the WebID used and the last successful sync date are stored in IndexedDB, survive a reload, and are available offline (in addition to the existing cellar/bottle/product/order persistence).

## Impact

- New application port (e.g. `src/application/ports/AppStateStore.ts`) — `getWebId`/`setWebId`, `getLastSyncedAt`/`setLastSyncedAt`.
- New infrastructure adapter (e.g. `src/infrastructure/local/IndexedDbAppStateStore.ts`) — raw IndexedDB (a dedicated DB/object store separate from soukai's engine, so it doesn't collide with soukai's schema/versioning). Works with `fake-indexeddb` in tests.
- `src/infrastructure/cdi/CDI.ts` — construct the store and inject it; add an accessor.
- `src/application/sync/SyncCoordinator.ts` — write the last sync date on a successful run; seed the initial `lastSyncedAt` from the store at startup (notifying listeners).
- Session-established path (`src/infrastructure/web/pages/landing-page.ts` `sessionChangedCallback`, which already handles LOGIN/SESSION_RESTORED with the WebID) — persist the WebID.
- `src/infrastructure/web/pages/profile-page.ts` — read the persisted WebID / last-sync for display when there is no live session.
- No Pod/domain-model changes; this metadata is local-only and is not synced to the Pod. No data migration.
