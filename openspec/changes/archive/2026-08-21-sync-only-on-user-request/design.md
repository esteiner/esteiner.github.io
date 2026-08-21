## Context

Synchronization is driven by `SyncCoordinator` (single-flight, status reporting) wrapping the `SynchronizeWithPod` use case, with `ReconnectSync` adding retry-with-backoff. Before this change there were four call sites:

1. `main.ts` after `restoreSession()` — unconditional `ReconnectSync.run()`.
2. `landing-page.ts` `sessionChangedCallback` on `LOGIN` / `SESSION_RESTORED` — resolved the Pod container base, then an unconditional `ReconnectSync.run()`.
3. `main.ts` `ConnectivityMonitor` on the browser `online` event — unconditional `ReconnectSync.run()`.
4. The manual Sync action (`landing-page.handleSyncClick`, `sync-status.syncNow`) — `requestSync("manual")`.

Only (4) reflects a user intent. (1) and (2) both fired on every reload with a stored session, which is what made a refresh sync. `requestSync("reconnect")` returns silently without a session, so the gate that existed was "is there a session", not "did anyone ask".

Two constraints shape the solution:

- **The request must survive a page unload.** Pressing Sync while logged out starts the OIDC flow, which navigates away from the app; the intent has to be readable after the redirect returns. `AppStateStore` (IndexedDB, device-local, already holds the WebID and last-sync date) is the natural home.
- **A sync needs a resolved Pod container base.** `SolidSyncService.synchronize()` throws without one, and on a first login the base is only known after `resolveKellermeisterContainer` runs on the landing page — i.e. *after* startup has already passed.

## Goals / Non-Goals

**Goals:**
- A sync runs only on an explicit user request, or as the deferred completion of one.
- A requested sync survives an OIDC redirect and an offline period, and runs exactly once afterwards.
- No sync on reload, on session restore, or on regaining connectivity by itself.

**Non-Goals:**
- Changing what a sync *does* (re-home, sweep, conflict resolution) or its retry/coalescing behaviour.
- Read-model cache invalidation after a sync. It is implemented (`ReadModelCache` port, `KellermeisterService.invalidate()`, called from `SynchronizeWithPod`, plus the landing page re-reading cellars when a run finishes), but it concerns freshness *after* a run, not what triggers one. Specifying it belongs in its own change so this one stays about triggers.
- Background or periodic sync.
- Any UI for inspecting or cancelling a pending request.

## Decisions

### Decision 1: A persisted "sync pending" flag as the single trigger gate
One boolean in `AppStateStore` (`isSyncPending` / `setSyncPending`, key `syncPending` in the existing app-state IndexedDB database) records that the user asked for a sync that has not happened. All non-manual entry points consult it; none of them syncs on its own.

- **Why not an in-memory flag?** It would not survive the OIDC redirect, which is the main case it exists for.
- **Why not `localStorage`?** The store for device-local app metadata already exists and is IndexedDB; adding a second mechanism for one boolean is not worth it. The write is awaited before the redirect is started, so it is committed in time.
- **Why not infer intent from `handleIncomingRedirect`?** The Inrupt session cannot tell "returned from a login I started by pressing Sync" from "restored an existing session on reload" — that distinction is exactly what the flag records.

### Decision 2: A `PendingSync` use case owns remember/consume
`PendingSync.remember()` sets the flag; `PendingSync.run()` consumes it and delegates to `ReconnectSync` (keeping retry-with-backoff). `ReconnectSync` becomes internal to it — `CDI.getReconnectSync()` is removed so no caller can bypass the gate by accident.

- **Alternative considered:** put the check in `SyncCoordinator.requestSync("reconnect")`. Rejected: the coordinator's job is single-flight coordination and status, and the trigger rule would then be invisible at the call sites.

### Decision 3: Keep the flag while the request cannot be served; clear it before the run
`run()` returns without doing anything — leaving the flag set — when there is no session, or when the Pod container base is not resolved yet. Otherwise it clears the flag first, then syncs.

- **Why keep it?** An abandoned or failed login means the user is still owed the sync; consuming the flag would silently drop it.
- **Why clear before rather than after?** A sync that fails permanently (e.g. corrupt data throwing on every attempt) would otherwise be retried on every single startup forever. `ReconnectSync` already retries with backoff within one run, and the user can press Sync again.
- **Trade-off accepted:** a request lost this way is not automatically retried later.

### Decision 4: Both startup and container resolution run the pending sync
`main.ts` runs it after `restoreSession()`; `landing-page.sessionChangedCallback` runs it after `setPodContainerBase()`. Startup wins when the base is already persisted from an earlier session; container resolution wins on a first login. Whichever is ready first performs the single sync — the flag makes it idempotent, and `SyncCoordinator`'s single-flight guard covers an overlap.

- **Alternative considered:** only run it after container resolution. Rejected: that path only exists on the landing page, so a request would not complete when the redirect returns to another route.

### Decision 5: A failed manual sync is remembered too
Without this, gating the `online` path would silently remove offline-retry: pressing Sync while offline would fail and nothing would ever complete it. After a manual request returns, the coordinator's state is inspected and a run that captured a failure is remembered.

- **Why inspect the state instead of catching?** `requestSync("manual")` only rejects with `NotAuthenticatedError`; other failures are captured into the sync status by design, so they are not observable as exceptions.
- The decision lives in `shouldRememberSync(state)` in `sync-ui-action.ts` (framework-agnostic, like the existing `syncFailureAction`) because the vitest environment is `node` with no DOM harness — logic inside a Lit component cannot be unit-tested.
- `syncing` is deliberately not remembered: that means the request was coalesced into an in-flight run, which owns its own outcome.

## Risks / Trade-offs

- **[A dropped request after a permanently failing sync]** → Accepted per Decision 3; the status shows "Fehler" and the Sync button is one click away.
- **[An abandoned login leaves the flag set]** → The next start *with* a session performs one sync. That is the requested sync arriving late, not a spurious one.
- **[IndexedDB unavailable (private mode)]** → `IndexedDbAppStateStore` degrades to no-op writes and `null` reads by design, so no deferred sync happens; the manual Sync action still works when logged in.
- **[Users who relied on the implicit reconnect sync]** → Behaviour is intentionally narrower. Anyone wanting "sync when I come back online" presses Sync while offline, which is then completed on reconnect.

## Migration Plan

Code-only; no data or Pod-side change. The flag defaults to absent (`false`), so existing installs simply stop syncing on reload. Rollback = restore the unconditional `ReconnectSync.run()` calls at the three non-manual call sites; the persisted flag is then ignored and harmless.

## Open Questions

None. The remaining unspecced behaviour from the same work (read-model cache invalidation, the engine-scope gate serialising local and Pod engine access) is deliberately left to separate changes.
