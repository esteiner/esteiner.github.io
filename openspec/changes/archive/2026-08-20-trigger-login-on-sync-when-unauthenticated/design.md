## Context

The manual sync UI has two entry points:

1. **`landing-page.ts`** — the user-visible sync button (`handleSyncClick`, landing-page.ts:336). It calls `SyncCoordinator.requestSync("manual")`; on `NotAuthenticatedError` it sets `this.hint = "Bitte anmelden zum Synchronisieren."`. The landing page **already owns the complete login flow**: `handleLoginClick` (landing-page.ts:238) opens a WebID dialog (`getWebID` → `handleWebIdOk`), resolves the WebID profile to an OIDC issuer, and calls `SolidService.login(issuer)`.
2. **`sync-status.ts`** — a reusable `<sync-status>` component with the same `requestSync("manual")` + hint logic (sync-status.ts:49). It is imported but **not mounted in any template**; it has no access to the login flow.

`SolidService.login()` performs a full-page OIDC redirect. On return, `main.ts` calls `restoreSession()` (main.ts:32) but does **not** trigger a sync; only `ConnectivityMonitor` → `ReconnectSync` fires syncs, and only on connectivity transitions. `SyncCoordinator.requestSync` already distinguishes `"manual"` (throws `NotAuthenticatedError` when logged out) from `"reconnect"` (skips silently). The `pod-synchronization` spec already contains a **Post-login synchronization** requirement; it is the natural home for "the sync completes after login."

## Goals / Non-Goals

**Goals:**
- Pressing the manual Sync button while logged out initiates the login flow instead of showing a passive hint.
- The sync the user requested actually runs once they return authenticated (post-login sync).
- Keep the sync-domain layer (`SyncCoordinator`) unchanged; this is UI-flow wiring.
- Keep the `<sync-status>` component decoupled from the concrete login flow.

**Non-Goals:**
- Changing conflict resolution, the container sweep, or any reconcile logic.
- Building a new login UI — reuse the landing page's existing WebID dialog + `SolidService.login`.
- Carrying the pre-login sync intent across the OIDC redirect (impossible for a full-page redirect; the post-login sync run covers it).
- Mounting `<sync-status>` somewhere new (it stays where it is; we only fix its unauthenticated behavior for future hosts).

## Decisions

### Decision 1: Landing page routes an unauthenticated manual sync into its own login flow
In `handleSyncClick`, when the sync request is not authenticated, call the existing `handleLoginClick()` (which opens the WebID dialog and, on confirmation, redirects to the IdP) instead of setting the not-authenticated hint.

- **Detection:** check `this.cdi.getAuthService().isLoggedIn()` (or catch `NotAuthenticatedError` from `requestSync`) — prefer checking auth up front so we don't start a sync run we know will reject, and branch to login. The `catch` still maps other errors to the generic failure hint.
- **Why:** the login flow is already implemented on this page; reusing it is the smallest correct change and matches how the login button behaves today.
- **Alternative considered:** duplicate the login flow or move it into the sync handler. Rejected — reusing `handleLoginClick` avoids duplication.

### Decision 2: `<sync-status>` emits a `login-required` event rather than triggering login itself
On `NotAuthenticatedError`, dispatch `new CustomEvent("login-required", {bubbles: true, composed: true})` instead of setting the not-authenticated hint. Non-auth failures keep the existing generic hint.

- **Why:** the component has no login flow and shouldn't depend on `SolidService` or the WebID dialog. Emitting an event keeps it presentational and lets whichever page hosts it wire the event to that page's login flow. `composed: true` lets the event cross the shadow-DOM boundary.
- **Alternative considered:** inject a login callback / navigate to the landing page from the component. Rejected — an event is the least-coupled Lit-idiomatic option, and the component is not currently mounted so no host wiring is lost.

### Decision 3: Trigger a post-login sync on session restore
After `restoreSession()` in `main.ts`, if a session is present, trigger a synchronization (via `requestSync("reconnect")`, which runs when authenticated and is a no-op / silent otherwise). This realizes the existing **Post-login synchronization** requirement so that Sync → login → return actually syncs.

- **Why `"reconnect"` not `"manual"`:** the post-login trigger should be silent and must not throw if, e.g., the session didn't actually restore; `"reconnect"` already has those semantics. Single-flight coalescing prevents a double run if connectivity also fires.
- **Alternative considered:** persist a "sync was requested" flag across the redirect and replay it as a manual sync. Rejected as over-engineered — an unconditional post-login sync is simpler and is already a stated requirement.

## Risks / Trade-offs

- **[Full-page redirect loses in-memory state]** → Expected for OIDC; the post-login sync (Decision 3) is what makes the requested sync happen, so no cross-redirect state is needed.
- **[User cancels the WebID dialog]** → No login, no sync; behavior matches pressing the login button and cancelling. No error surfaced (or the existing benign state remains).
- **[Double sync after login (post-login trigger + connectivity event)]** → `SyncCoordinator` single-flight coalescing already collapses concurrent triggers into one follow-up run; no duplication.
- **[`<sync-status>` event has no host listener today]** → It isn't mounted, so this is latent-but-correct; documented so a future host knows to handle `login-required`.

## Migration Plan

UI-only, code change; no data migration and no persisted-format change. Rollback restores the prior hint-only behavior without touching stored data.

## Open Questions

None — the login flow, the sync-domain contract (`NotAuthenticatedError` / `"reconnect"`), and the existing Post-login synchronization requirement are all already in place; this change only wires them together at the UI layer.
