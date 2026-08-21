## Context

Local state on a device today:

| Store | Contents | Identity-scoped? |
|---|---|---|
| IndexedDB `kellermeister` | Soukai domain data: cellars, bottles, products, orders | Yes — belongs to whoever created it |
| IndexedDB `kellermeister-appstate` | WebID, last-sync date, pending-sync flag | Yes |
| localStorage `km.podContainerBase` | Resolved Pod container base | Yes |
| localStorage `kellermeister_webid_history` | WebIDs typed into the login dialog | No — a device-level picker list |

The WebID is already persisted (`AppStateStore.getWebId()`), written in `landing-page.sessionChangedCallback` whenever a session is established. So the marker needed to detect a switch exists; nothing reads it for that purpose yet.

Two places learn a WebID, and they differ in what they can promise:

- **The login dialog** (`handleWebIdOk` → `login(issuer)`): the user picks a WebID and its profile is fetched, *then* the OIDC redirect navigates away. This is the only point where a warning is genuinely "in advance" — before the user leaves the app and before any new session exists.
- **Session establishment** (`sessionChangedCallback` on `LOGIN` / `SESSION_RESTORED`): reports the WebID the identity provider actually authenticated, which is not necessarily the one typed into the dialog. This is the authoritative check, but it runs when the new session already exists.

Both are needed: the first for the user-facing promise, the second so the guarantee cannot be bypassed (a session restored from another WebID, or an IdP that authenticates someone other than the WebID typed).

A further constraint: `CDI` is a singleton that eagerly constructs repositories, `SoukaiCellarRepository` holds a `ready` bootstrap promise for the well-known cellars, `KellermeisterService` caches read models, and `PodContainerRegistry` caches the base in a field. Deleting the underlying databases does not reset any of that.

## Goals / Non-Goals

**Goals:**
- Data belonging to a previous WebID never becomes visible to, or is synced into the Pod of, a different WebID.
- The user is warned before anything is destroyed, is told that unsynced data is lost, and can cancel.
- The post-wipe app is indistinguishable from a fresh install that has just logged in as the new WebID.

**Non-Goals:**
- Keeping several identities' data side by side on one device (per-WebID databases, profile switching). A much larger change; the wipe is the agreed behaviour.
- Syncing the old identity's data before wiping, or blocking the switch until it is synced. Considered and rejected in favour of a warning (see Decision 4).
- Recovering wiped data. There is no undo, which is exactly why the warning is a requirement rather than a nicety.
- Wiping the WebID history list, or any localStorage not written by this app.

## Decisions

### Decision 1: The persisted WebID is the identity marker
A switch is "the WebID being established differs from `AppStateStore.getWebId()`". No new storage is introduced; the value already exists and already survives reloads.

- **Absent marker means first use, not a switch.** On a device that has never logged in, local data was created by this same user before authenticating (the app is usable offline), so wiping it would destroy exactly the data the local-first design promises to keep. No warning either — there is nothing to warn about.
- **Alternative considered:** hashing the WebID or storing a separate `ownerWebId` key. Rejected as duplicate state that can disagree with the value already stored.

### Decision 2: Detect at both entry points, with different guarantees
- In the **login dialog**, once the chosen WebID is known and before `login()` redirects, compare it with the marker. On a difference, show the confirmation. Cancelling here simply does not start the login — nothing has changed, nothing is destroyed.
- In **session establishment**, compare the session's WebID with the marker before the session is used (before the container base is resolved and before any sync). On a difference, show the confirmation. Cancelling here means the app must *not* adopt the session: log out and keep the previous identity's data.

The dialog check is the user-facing "in advance" promise; the session check is the enforcement point. When the dialog check already warned and the user confirmed, the session check finds the same difference and must not warn twice — the confirmed intent is carried across the redirect (see Decision 5).

- **Alternative considered:** only check at session establishment. Simpler, but the user would be warned *after* being sent through an external login flow, which is not "in advance" in any useful sense.

### Decision 3: Wipe via the engine's own purge, then reload
- Soukai's `kellermeister` database: `IndexedDBEngine.purgeDatabase()`. `indexedDB.deleteDatabase()` blocks while connections are open, and the engine holds them; the engine's own purge avoids that race entirely.
- `kellermeister-appstate`: `indexedDB.deleteDatabase()` is safe here because `IndexedDbAppStateStore` opens and closes a connection per operation.
- `km.podContainerBase`: remove from localStorage **and** clear the in-memory field in `PodContainerRegistry`.
- Then **reload the application**.

Reloading is the decision worth justifying: it is the only way to guarantee that no pre-wipe state survives. The alternative is a "reset" path through `CDI` — re-running the cellar bootstrap, invalidating the service caches, resetting the registry, re-booting the Soukai engine — i.e. a second initialisation path that has to be kept in step with startup forever, and whose bugs would show up as one identity's data leaking into another. A reload reuses the startup path that is already exercised on every visit.

- **Trade-off:** a visible page reload right after login. Acceptable for a rare, deliberate action that the user has just confirmed.

### Decision 4: Warn about unsynced data without trying to rescue it
The confirmation states that local data will be deleted and that anything not yet synchronized to the previous WebID's Pod cannot be recovered. It does not attempt to sync first.

- **Why not offer "sync the old data first"?** That needs a valid session *for the old WebID*, which is precisely what is being replaced. At the session-establishment check the old session is already gone; at the dialog check the user may have been logged out for weeks. An option that only sometimes works, on a destructive path, is worse than a clear warning.
- **Why not block until synced?** It would trap a user whose old Pod is unreachable — they could never log in as anyone else on that device without clearing browser storage by hand.
- The user has a non-destructive escape either way: cancel, log in as the old WebID, sync, then switch.

### Decision 5: Order of operations, and what a crash leaves behind
1. Detect the difference.
2. Warn; abort on cancel (per Decision 2).
3. Wipe the domain database, the app-state database, and the container base.
4. Write the **new** WebID as the marker.
5. Reload.

Step 4 must follow step 3 — the app-state wipe would otherwise erase the marker just written. If the app dies between 3 and 4, the marker is absent, so the next login sees "first use": no warning, no wipe. That is the safe outcome, because the data is already gone; the only cost is that the new identity starts from a clean store, which is what was being asked for anyway.

The wipe is idempotent: purging an already-empty database, deleting an absent database, and removing an absent localStorage key are all no-ops.

### Decision 6: The decision logic lives in the application layer
A `SwitchIdentity`-style use case owns "is this a different WebID" and the ordering above, against a port for the destructive operations (`LocalDataStore.wipe()` or similar). The infrastructure adapter knows about `IndexedDBEngine.purgeDatabase`, `indexedDB.deleteDatabase`, and localStorage; the confirmation itself stays in the Lit layer behind a callback, because the vitest environment is `node` with no DOM harness — the same pattern as `syncFailureAction`/`shouldRememberSync`. This keeps the ordering, the first-use rule, and the cancel semantics unit-testable.

## Risks / Trade-offs

- **[Unsynced data is destroyed]** → Warned explicitly, cancellable, and the user can sync under the old identity first. No undo by design.
- **[A confirmed switch must survive the OIDC redirect]** → The intent is carried across the redirect (same mechanism class as the pending-sync flag). If it does not survive, the session-establishment check warns again — annoying but safe. Losing the *marker* instead would silently skip the wipe, so the marker must not be touched before step 3.
- **[The IdP authenticates a different WebID than the one typed]** → Exactly why the session-establishment check is authoritative rather than trusting the dialog.
- **[Reload loses in-flight UI state]** → Only on a deliberate identity switch, immediately after login, when there is nothing meaningful in flight.
- **[IndexedDB or localStorage unavailable (private mode)]** → The existing stores already degrade to no-op writes and `null` reads, so there is no marker and no persisted data to leak; the wipe becomes a no-op. Nothing to protect in that mode.
- **[The wipe is blocked by another tab]** → `IndexedDBEngine.purgeDatabase()` fails while any other connection to the local database is open, and the realistic trigger is a second tab of the app running its own engine. The switch then refuses: the session is NOT adopted, the user is told to close the other tabs, and the previous identity's data stays put. Blunt but safe — the alternative (adopting the session with the old data still present) is exactly what this change exists to prevent. Coordinating across tabs (a `BroadcastChannel` telling other tabs to close their engine connections before the purge) would make the switch work with tabs open; deferred to its own change, since a WebID switch is rare and "close your other tabs" is actionable.
- **[A wipe that partially fails]** → Because the marker is written last, a failure leaves the app looking like first use rather than like the previous identity, so the failure cannot cause the previous identity's data to be adopted under the new WebID. It can leave orphaned records in a partly-purged store; the requirement is stated as "the local data of the previous identity is not readable by the new session", which a re-run of the wipe restores.

## Migration Plan

Code-only; no Pod-side change. Existing installs have a marker (the WebID has been persisted since the app-state store was introduced), so the first login after this change compares against it: same WebID → nothing happens; different WebID → the user is warned. Devices whose marker predates the store simply count as first use.

Rollback = remove the detection call sites; the wipe port becomes unused and no data is touched.

## Open Questions

None.
