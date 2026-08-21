## Why

Local data is the source of truth in this app: cellars, bottles, products, and orders live in IndexedDB and are re-homed to whichever Pod the user is logged into on the next sync. Nothing currently ties that local store to an identity. If a second person logs in on the same device — or the same person switches to another WebID — the previous WebID's data is still present, is shown to the new user, and would be pushed into the new user's Pod on the next sync. That is both a privacy leak and a data-integrity problem: two identities' data silently merge.

Local state also carries stale identity-scoped values (the resolved Pod container base, the last-sync date, a pending-sync request) which are meaningless — and actively wrong — for a different WebID.

## What Changes

- When a session is established for a WebID that differs from the WebID last used on this device, the system SHALL delete the local data belonging to the previous identity before the new session is used.
- The user SHALL be informed **before** the deletion happens and SHALL be able to cancel it. Cancelling means not switching identity; the previous WebID's data stays intact.
- The warning SHALL state explicitly that local data not yet synchronized to the previous WebID's Pod is lost for good, because the app cannot recover it afterwards.
- Scope of the wipe: the Soukai domain database (`kellermeister`), the app-state database (`kellermeister-appstate`: WebID, last-sync date, pending-sync flag), and the persisted Pod container base (`km.podContainerBase`).
- Explicitly **not** wiped: the WebID history list used to pre-fill the login dialog (`kellermeister_webid_history`). It is a device-level convenience list of WebIDs the user typed themselves, not data belonging to one identity, and clearing it would only make switching back harder.
- A first login on a device (no WebID recorded yet) SHALL NOT wipe anything and SHALL NOT warn — there is no previous identity, and the local data was created by this same user before logging in.

## Capabilities

### New Capabilities
- `identity-scoped-local-data`: ties the local store to the WebID that owns it — detecting a WebID switch, warning before destroying data, performing the wipe, and leaving the app in a clean post-wipe state.

### Modified Capabilities
- `local-persistence`: the local store is no longer unconditionally durable. A new requirement records that local data belongs to the WebID last used on the device and is deleted when that identity changes; *Session metadata persists locally in IndexedDB* is amended so the persisted WebID also serves as the identity marker that a switch is detected against.

## Impact

- Detection needs the WebID *before* the new session is used. Both entry points must be covered: the login dialog (where the user picks a WebID, so the warning is genuinely in advance of the OIDC redirect) and session establishment (`sessionChangedCallback`, which also fires for a restored session and is the only place that sees the WebID the identity provider actually authenticated).
- New application port + use case for the wipe (deleting whole IndexedDB databases is infrastructure work; the decision "does this WebID differ" is application logic).
- `src/infrastructure/local/IndexedDbAppStateStore.ts` — the stored WebID becomes the identity marker; needs a delete/clear path.
- `src/infrastructure/solid/PodContainerRegistry.ts` — must be reset in memory as well as in localStorage, since it caches the base in a field.
- `src/infrastructure/cdi/CDI.ts` — repositories and the application service hold cached read models and a bootstrap promise; after a wipe they must not serve pre-wipe state (see design).
- `src/infrastructure/web/pages/landing-page.ts` — the confirmation UI and the cancel path.
- **BREAKING** for users sharing a device across WebIDs: switching identity now destroys local data instead of carrying it over. That is the intent.
