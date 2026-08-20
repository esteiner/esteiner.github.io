## 1. App-state store (port + IndexedDB adapter)

- [x] 1.1 Add an application port `AppStateStore` (`src/application/ports/AppStateStore.ts`): `getWebId(): Promise<string | null>`, `setWebId(webId: string): Promise<void>`, `getLastSyncedAt(): Promise<Date | null>`, `setLastSyncedAt(date: Date): Promise<void>`.
- [x] 1.2 Add an infrastructure adapter `IndexedDbAppStateStore` (`src/infrastructure/local/IndexedDbAppStateStore.ts`): raw IndexedDB, a dedicated DB (e.g. `kellermeister-appstate`) with one object store (e.g. `appState`) keyed by field name. Store the date as an ISO string; parse back to `Date` on read (guard empty/invalid). Guard `typeof indexedDB === "undefined"` so reads resolve `null` and writes no-op when unavailable.

## 2. Persist the values

- [x] 2.1 In `SyncCoordinator`, inject `AppStateStore`; in the successful-run branch (where `lastSyncedAt = new Date()` is set) also `await store.setLastSyncedAt(...)`.
- [x] 2.2 In the session-established path (`landing-page.ts` `sessionChangedCallback`, where `session.info.webId != null`), call `appState.setWebId(webId)`.

## 3. Seed and expose

- [x] 3.1 In `SyncCoordinator` construction, asynchronously load the persisted last sync date; when it resolves, set `status.lastSyncedAt` and notify listeners so a reload shows the real last-sync time before any new sync.
- [x] 3.2 On the profile page, read the persisted WebID (prefer the live session WebID, fall back to the stored one) so it shows without a live session; the last-sync display already reflects the seeded status.
- [x] 3.3 Wire the store in `CDI` (construct `IndexedDbAppStateStore`, inject into `SyncCoordinator`, add a `getAppStateStore()` accessor).

## 4. Tests

- [x] 4.1 Test `IndexedDbAppStateStore` under `fake-indexeddb`: set/get round-trips for WebID and last sync date (Date in → Date out); unset values return `null`.
- [x] 4.2 Test `SyncCoordinator` with a fake `AppStateStore`: a successful run calls `setLastSyncedAt`; construction seeds `lastSyncedAt` from the store and notifies listeners; a failed run does not overwrite the persisted date.

## 5. Verification

- [x] 5.1 Typecheck (`tsc --noEmit`) and run the full test suite.
- [x] 5.2 Manually verify in the running app (best-effort): after a sync, reload → the last-sync time is shown (not "Nur lokal"); the last-used WebID is displayed on the profile page. Confirm the metadata does not appear in Pod resources.
