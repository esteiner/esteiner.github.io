## 1. Landing page: sync triggers login when unauthenticated

- [x] 1.1 In `landing-page.ts` `handleSyncClick`, when the user is not authenticated (check `isLoggedIn()` up front, or catch `NotAuthenticatedError` from `requestSync("manual")`), call the existing `handleLoginClick()` to start the login flow instead of setting the "Bitte anmelden zum Synchronisieren." hint. (Catch approach — `requestSync("manual")` only rejects with `NotAuthenticatedError`; classification via the shared `syncFailureAction` helper.)
- [x] 1.2 Keep the generic failure hint for non-authentication errors, and ensure a successful/authenticated sync path is unchanged. (A logged-in run captures its own failures into the sync status → `syncLabel()` shows "Fehler"; the landing page's `hint` field was write-only/never rendered, so it was removed and non-auth catch failures are logged.)

## 2. sync-status component: emit login-required

- [x] 2.1 In `sync-status.ts` `syncNow`, on `NotAuthenticatedError` dispatch `new CustomEvent("login-required", {bubbles: true, composed: true})` instead of setting the not-authenticated hint. (Classification via `syncFailureAction`.)
- [x] 2.2 Preserve the existing generic hint for non-authentication failures.

## 3. Post-login synchronization

- [x] 3.1 In `main.ts` (after `restoreSession()`), trigger a sync via the reconnect path (`getReconnectSync().run()`, which uses `requestSync("reconnect")` with backoff) so a sync started by pressing Sync completes once the user returns authenticated. Skipped silently when there is no session; single-flight coalescing avoids a duplicate run if connectivity also fires.

## 4. Tests

- [x] 4.1 Decision logic extracted to the framework-agnostic `syncFailureAction` helper and unit-tested (`sync-ui-action.test.ts`): a `NotAuthenticatedError` → `{kind: "login"}`; any other error / non-Error rejection → generic-failure hint. (The Lit component/page DOM wiring itself is not unit-tested — the vitest env is `node` with no DOM harness; the design anticipated extracting the decision into a testable helper.)
- [x] 4.2 Covered by 4.1: the `login` vs `hint` branch that drives the `login-required` event vs the generic hint is exercised by `sync-ui-action.test.ts`.
- [x] 4.3 Post-login trigger tested via `ReconnectSync.test.ts` (the mechanism `main.ts` invokes): with a session it runs a sync; with no session it is a silent no-op (no throw, status stays `idle`); it retries with backoff on repeated failure. Coordinator-level reconnect/manual semantics remain covered by `SyncCoordinator.test.ts`.

## 5. Verification

- [x] 5.1 Typecheck (`tsc --noEmit`) passes and the full test suite passes (116 tests, 12 files).
- [x] 5.2 Manual verify (best-effort): production build (`vite build`) succeeds. The logged-out Sync → login → post-login sync round-trip needs live Solid Pod credentials not available here; the decision logic (Sync-when-unauthenticated → login) and the post-login reconnect trigger are verified by unit tests, and tsc confirms the landing-page/`sync-status`/`main.ts` wiring compiles.
