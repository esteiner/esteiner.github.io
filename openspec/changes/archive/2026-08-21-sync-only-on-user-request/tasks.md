Status: the implementation already exists in the working tree; this change specifies it. Items are checked where the code and tests are in place — see 5.3 for what is still unverified.

## 1. Persist the request

- [x] 1.1 Extend the `AppStateStore` port (`src/application/ports/AppStateStore.ts`) with `isSyncPending(): Promise<boolean>` and `setSyncPending(pending: boolean): Promise<void>`.
- [x] 1.2 Implement both in `IndexedDbAppStateStore` under a `syncPending` key in the existing app-state database; `isSyncPending()` returns `false` for an unset or non-boolean value, and the existing IndexedDB-unavailable guard keeps reads `null`/writes no-op.

## 2. Remember and consume the request

- [x] 2.1 Add the `PendingSync` use case (`src/application/sync/PendingSync.ts`) with `remember()` (set the flag) and `run()` (carry out a remembered request via `ReconnectSync`, keeping its retry-with-backoff).
- [x] 2.2 In `run()`, return without acting — leaving the flag set — when there is no session or the Pod container base is not resolved (injected as a `podResolved: () => boolean` predicate, so the application layer stays free of Pod-container knowledge); otherwise clear the flag BEFORE syncing (design Decision 3).
- [x] 2.3 Wire it in `CDI`: construct `PendingSync(authService, appStateStore, reconnectSync, () => podBase() !== null)`, expose `getPendingSync()`, and remove `getReconnectSync()` so no caller can bypass the gate.

## 3. Gate the non-manual trigger points

- [x] 3.1 `main.ts` startup: replace the unconditional `getReconnectSync().run()` after `restoreSession()` with `getPendingSync().run()`.
- [x] 3.2 `main.ts` `ConnectivityMonitor` callback: same replacement, so regaining connectivity only completes a remembered request.
- [x] 3.3 `landing-page.ts` `sessionChangedCallback`: drop the unconditional sync on `LOGIN`/`SESSION_RESTORED`; keep resolving the Pod container base, then run the remembered request (this is where a first login first learns the base — design Decision 4).

## 4. Remember on the manual path

- [x] 4.1 Add `shouldRememberSync(state: SyncState)` to `src/infrastructure/web/sync-ui-action.ts` — `true` for `error` only, so a coalesced (`syncing`) or successful (`idle`) run is not remembered.
- [x] 4.2 `landing-page.handleSyncClick`: after `requestSync("manual")` returns, remember the request when the coordinator's state says the run failed (a network failure is captured into the status, not thrown, so it cannot be caught); and remember it before starting the login flow on `NotAuthenticatedError`.
- [x] 4.3 `sync-status.ts` `syncNow`: same two cases, remembering before dispatching `login-required`.

## 5. Tests and verification

- [x] 5.1 `PendingSync.test.ts`: a plain start with nothing remembered does not sync; a remembered request syncs exactly once and is then forgotten; it is kept when logged out; it is kept while the container base is unresolved and runs once resolved; it is forgotten even when the run throws.
- [x] 5.2 `IndexedDbAppStateStore.test.ts`: the flag defaults to `false` and round-trips across store instances (the reload/redirect case). `sync-ui-action.test.ts`: `shouldRememberSync` for `error` / `idle` / `syncing`. The in-memory `AppStateStore` fake was extracted to `src/application/sync/appStateStore.fake.ts` and shared with `SyncCoordinator.test.ts`.
- [ ] 5.3 Manual verification against a live Pod — NOT done: needs Solid credentials unavailable in this environment. To check: a reload with a stored session triggers no Pod sync traffic; Sync while logged out → login → exactly one sync on return; Sync while offline → failure → one sync when connectivity returns; going online with nothing pending stays quiet.
- [x] 5.4 Typecheck (`tsc --noEmit`), full test suite, and production build pass.
