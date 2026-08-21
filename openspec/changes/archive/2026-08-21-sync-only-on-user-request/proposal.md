## Why

Every page load with a stored session synchronized with the Pod: `main.ts` ran a sync unconditionally after `restoreSession()`, and the landing page ran another one on every `SESSION_RESTORED` event. A refresh is not a request to sync — it cost Pod traffic the user never asked for, and (with the engine swap being global) a sync racing the startup bootstrap sent local reads to the Pod as `local://cellars/`. Synchronization should happen when the user asks for it, and only then.

The behaviour is already implemented in the working tree; this change specifies it, because two requirements in the `pod-synchronization` spec now contradict the code.

## What Changes

- A sync SHALL run only when the user requests it via the manual Sync action, or as the deferred completion of such a request. **BREAKING** for the spec: a restored session, a page reload, and a regained network connection no longer trigger a sync by themselves.
- A requested sync that cannot run yet SHALL be remembered (persisted, device-local) and completed later. This covers the two ways a request outlives the attempt: pressing Sync while logged out sends the user through an OIDC redirect that navigates away from the app, and pressing Sync while offline fails outright.
- A remembered request SHALL be kept while it cannot be served — no session, or no resolved Pod container base — and SHALL be cleared before the run once it can, so a repeatedly failing sync is not replayed on every startup.
- Both entry points that can reach the remembered request (application startup and Pod-container resolution after a session is established) SHALL run it, so whichever is ready first performs the single sync.
- **Supersedes** two existing requirements: *On-reconnect synchronization* (connectivity restored + valid session always triggers a sync) and *Post-login synchronization* (any successful login triggers a sync).

## Capabilities

### New Capabilities
<!-- None. The trigger rules belong to the existing pod-synchronization capability. -->

### Modified Capabilities
- `pod-synchronization`: *On-reconnect synchronization* and *Post-login synchronization* are replaced by trigger rules based on an explicit, persisted user request; a new requirement covers remembering, keeping, and consuming that request. *Manual synchronization* gains the rule that a failed manual run is remembered for later completion.

## Impact

- `src/application/sync/PendingSync.ts` (new) — remembers and consumes the request; skips (keeping the flag) without a session or resolved container base.
- `src/application/ports/AppStateStore.ts`, `src/infrastructure/local/IndexedDbAppStateStore.ts` — `isSyncPending()` / `setSyncPending()`, persisted in the existing app-state IndexedDB store so the flag survives the login redirect.
- `src/infrastructure/web/main.ts` — startup and the `ConnectivityMonitor` callback run `PendingSync.run()` instead of `ReconnectSync.run()`.
- `src/infrastructure/web/pages/landing-page.ts` — `sessionChangedCallback` resolves the container base and then runs a remembered sync (previously an unconditional sync); `handleSyncClick` remembers a failed run.
- `src/infrastructure/web/sync-ui-action.ts` — `shouldRememberSync(state)` helper (framework-agnostic, so it is unit-testable in the node test environment).
- `src/infrastructure/web/components/sync-status.ts` — same remember-on-failure and remember-before-login handling as the landing page.
- `src/infrastructure/cdi/CDI.ts` — constructs `PendingSync` (wired to the container registry for the resolved-base predicate); `getReconnectSync()` removed, `ReconnectSync` is now internal to `PendingSync`.
- No Pod-side or data-model impact: this only changes *when* a sync runs. `ReconnectSync`'s retry-with-backoff and `SyncCoordinator`'s single-flight coalescing are unchanged.
- Not included: read-model cache invalidation after a successful sync (also implemented, but it concerns freshness *after* a run rather than what triggers one) — see design Non-Goals.
