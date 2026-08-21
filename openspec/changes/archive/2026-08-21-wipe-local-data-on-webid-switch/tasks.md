## 1. Wipe the local stores (infrastructure)

- [x] 1.1 Add an application port for the destructive operation (e.g. `LocalDataStore` in `src/application/ports/`) with a single `wipe(): Promise<void>`, so the application layer owns the decision and the ordering while the browser-storage details stay in infrastructure.
- [x] 1.2 Implement the adapter: purge the Soukai domain database with `IndexedDBEngine.purgeDatabase()` (NOT `indexedDB.deleteDatabase`, which blocks while the engine holds connections open — design Decision 3); delete `kellermeister-appstate` with `indexedDB.deleteDatabase()` (safe, since `IndexedDbAppStateStore` closes its connection per operation); remove `km.podContainerBase` from localStorage.
- [x] 1.3 Reset `PodContainerRegistry`'s in-memory base as part of the wipe (it caches the value in a field, so removing the localStorage key alone leaves the old base live) — e.g. a `clear()` method used by the adapter.
- [x] 1.4 Do NOT touch `kellermeister_webid_history`. Make the wipe idempotent: purging an empty database, deleting an absent one, and removing an absent key must all succeed.

## 2. Detect the switch and order the steps (application)

- [x] 2.1 Add a use case (e.g. `SwitchIdentity` in `src/application/sync/` or a new `identity/` folder) exposing "does this WebID differ from the recorded one" and the confirmed-switch sequence: wipe → record the NEW WebID → signal that a restart is needed.
- [x] 2.2 Treat an absent recorded WebID as first use: no warning, no wipe, so data created offline before the first login survives and can be synced.
- [x] 2.3 Record the new WebID strictly AFTER the wipe (the wipe deletes the app-state database, which would otherwise erase the marker just written), so an interrupted switch degrades to "first use" rather than adopting the previous identity's data (design Decision 5).
- [x] 2.4 Keep the confirmation out of this layer: take the user's decision as an injected callback / boolean result, so the ordering and the first-use rule stay unit-testable in the `node` vitest environment.

## 3. Warn in advance (login dialog)

- [x] 3.1 In `landing-page.handleWebIdOk`, once the chosen WebID is known and its profile has been fetched but BEFORE `login()` redirects, compare it with the recorded WebID and, on a difference, show a confirmation stating that local data will be deleted and that data not yet synced to the previous WebID's Pod cannot be recovered.
- [x] 3.2 On cancel, do not start the login and leave all local state untouched.
- [x] 3.3 On confirm, persist the confirmed intent so it survives the OIDC redirect (same mechanism class as the pending-sync flag), so the user is not asked a second time when the session is established.

## 4. Enforce at session establishment

- [x] 4.1 In `landing-page.sessionChangedCallback`, before the session is used — before `resolveKellermeisterContainer` and before any sync — compare `session.info.webId` with the recorded WebID. This is the authoritative check: the identity provider may authenticate a WebID other than the one typed, and a restored session never passes through the dialog.
- [x] 4.2 On a difference with no confirmed intent carried over, show the same confirmation here.
- [x] 4.3 On confirm (or with a confirmed intent from step 3.3), run the switch sequence and then reload the application, so no pre-wipe in-memory state survives (`CDI`'s eagerly built repositories, `SoukaiCellarRepository.ready`, the `KellermeisterService` caches, the registry field) — design Decision 3.
- [x] 4.4 On cancel, do NOT adopt the session: log out and leave the previous identity's data intact.
- [x] 4.5 Ensure the existing `setWebId` call in this method no longer writes the marker independently of the switch sequence, or the switch would be undetectable on the next login.

## 5. Tests

- [x] 5.1 Use-case tests with a fake `AppStateStore` and a recording `LocalDataStore`: same WebID → no wipe; different WebID → wipe then record; absent marker → neither; the recorded WebID is written only after the wipe; the sequence is idempotent when re-run.
- [x] 5.2 Adapter test under `fake-indexeddb`: seed the domain and app-state databases plus both localStorage keys, run the wipe, then assert the domain data and app-state values are gone, `km.podContainerBase` is gone and the registry reports an unresolved base, and `kellermeister_webid_history` is untouched. Re-running the wipe succeeds.
- [x] 5.3 Acceptance test over the real repositories (in the style of `local-first.test.ts`): create cellars/bottles as WebID A, run the switch to WebID B, and assert none of A's data is readable afterwards and that the well-known cellars are recreated on the next bootstrap.
- [x] 5.4 Regression test for the interrupted switch: wipe succeeds, recording the marker fails → the next login is treated as first use and presents no data from the previous identity.
- [x] 5.5 Typecheck (`tsc --noEmit`), full test suite, and production build.

## 6. Verification

Both checked by the user in the browser with two Solid accounts; both behave as specified.

- [x] 6.1 Manual verification in the browser with two WebIDs (needs two Solid accounts): log in as A, create data, log out; log in as B → the warning appears before the redirect; confirm → A's data is gone, B starts clean, the container base is re-resolved under B's Pod; the WebID picker still offers both.
- [x] 6.2 Manual check of the cancel paths: cancelling at the dialog starts no login and keeps A's data; cancelling after a session was established logs out and keeps A's data.
