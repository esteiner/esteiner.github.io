## Why

When a logged-out user presses the manual "Sync" button, nothing useful happens: the sync layer raises a not-authenticated condition and the UI merely shows the hint "Bitte anmelden zum Synchronisieren." The user then has to find and use a separate login action. Pressing Sync clearly expresses the intent to synchronize, so it should start the login flow directly and let the sync proceed once the user is authenticated.

## What Changes

- When the manual sync action is invoked without a valid Solid session, the UI SHALL initiate the login flow (WebID entry → OIDC redirect) instead of only displaying a not-authenticated hint.
- The landing page's `Sync` handler routes an unauthenticated sync into the existing login flow it already owns (`handleLoginClick` → WebID dialog → `SolidService.login`).
- The reusable `<sync-status>` component (currently not mounted, but part of the sync UI surface) emits a `login-required` event on an unauthenticated sync instead of swallowing the condition into a local hint, so any host can wire it to the login flow.
- Ensure the sync the user asked for actually runs after they return authenticated: wire the existing **Post-login synchronization** requirement so a sync is triggered once a session is restored after the OIDC redirect. (The login is a full-page redirect, so the pre-login sync intent cannot be carried in memory; the post-login sync run fulfills the intent instead.)

## Capabilities

### New Capabilities
<!-- None; this refines the existing pod-synchronization capability. -->

### Modified Capabilities
- `pod-synchronization`: The manual-sync-without-a-session behavior is tightened — invoking manual sync while unauthenticated SHALL initiate the login flow (not merely surface a condition for a passive hint). The existing Post-login synchronization requirement is clarified to cover the login-triggered-by-sync path so the requested sync completes after authentication.

## Impact

- `src/infrastructure/web/pages/landing-page.ts` — `handleSyncClick` triggers the login flow when the sync request is not authenticated (reusing `handleLoginClick`/the WebID dialog); drops/keeps the hint only for genuine (non-auth) sync failures.
- `src/infrastructure/web/components/sync-status.ts` — on `NotAuthenticatedError`, dispatch a `login-required` `CustomEvent` (bubbling, composed) instead of setting the not-authenticated hint; keep the hint for other failures.
- `src/infrastructure/web/main.ts` (or the session-restore path) — trigger a sync after `restoreSession()` when a session is present, so the post-login return actually synchronizes.
- No domain/application logic changes to `SyncCoordinator` (it already raises `NotAuthenticatedError` for the manual path and supports the post-login trigger); the change is UI-flow wiring.
- No data migration.
