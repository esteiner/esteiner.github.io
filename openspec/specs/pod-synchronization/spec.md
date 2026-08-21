# pod-synchronization Specification

## Purpose

Synchronization reconciles Kellermeister's local IndexedDB store with the user's Solid Pod. It can be triggered manually, automatically on network reconnect, and after a successful login, without gating application usability on session establishment. A single-flight coordinator ensures at most one sync runs at a time, sweeping every tracked collection to union local and remote resources, resolve conflicts through CRDT operation-log merges with Last-Write-Wins per property, and propagate cross-device deletions. Throughout, the system reports sync status (idle, syncing, error) and the time of the last successful synchronization to the UI.

## Requirements

### Requirement: Manual synchronization
The system SHALL provide a manual action that triggers synchronization between local storage and the Solid Pod. When the manual action is invoked without a valid Solid session, the system SHALL initiate the login flow so the user can authenticate, rather than only surfacing a passive not-authenticated message, and SHALL remember the request so it is carried out after authentication. When an invoked run fails, the system SHALL remember the request so it can be completed later; a request that was coalesced into an already-running sync SHALL NOT be remembered, because that run reports its own outcome.

#### Scenario: Manual sync when online and authenticated
- **WHEN** the user invokes the manual sync action while online with a valid Solid session
- **THEN** the system pulls, merges, and pushes all tracked collections and updates the sync status to reflect completion
- **AND** no request is left remembered

#### Scenario: Manual sync without a session triggers login
- **WHEN** the user invokes the manual sync action with no valid session
- **THEN** the system does not sync
- **AND** the system initiates the login flow (prompting the user for their WebID and starting the OIDC login) instead of showing only a not-authenticated hint
- **AND** the request is remembered before the login flow navigates away from the application

#### Scenario: Manual sync failure that is not an authentication problem
- **WHEN** the user invokes the manual sync action with a valid session and the run fails for a reason other than a missing session (for example, the network drops)
- **THEN** the login flow is NOT initiated
- **AND** the system surfaces a synchronization-failure indication to the user
- **AND** the request is remembered so that regaining connectivity completes it

### Requirement: On-reconnect synchronization
When network connectivity is restored, the system SHALL carry out a remembered synchronization request, provided a valid Solid session and a resolved Pod container base exist. Restored connectivity alone SHALL NOT trigger a synchronization run.

#### Scenario: Connectivity restored with a remembered request
- **WHEN** the device transitions from offline to online, a valid session exists, and a synchronization request is remembered
- **THEN** the system carries out one synchronization run

#### Scenario: Connectivity restored without a remembered request
- **WHEN** the device transitions from offline to online with a valid session and nothing is remembered
- **THEN** the system does not synchronize

#### Scenario: Connectivity restored without a session
- **WHEN** the device transitions from offline to online but no valid session exists
- **THEN** the system skips synchronization silently without prompting for login
- **AND** any remembered request stays remembered

### Requirement: Post-login synchronization
After a session is established, the system SHALL carry out a remembered synchronization request rather than gating application usability on session establishment. A session being established or restored SHALL NOT by itself trigger a synchronization run. Because a first login learns the Pod container base only after the session exists, both the application start and the completion of container resolution SHALL attempt to carry out the remembered request, and the request SHALL result in exactly one run regardless of which attempt is first.

#### Scenario: Login started by pressing Sync completes the requested sync
- **WHEN** a logged-out user presses the manual Sync button, is taken through the login flow, and returns with a restored session
- **THEN** the system carries out one synchronization run without requiring the user to press Sync again

#### Scenario: First login after offline use completes the requested sync
- **WHEN** a user who created data offline invokes the manual sync action, logs in successfully, and the Pod container base is resolved for the first time
- **THEN** the system carries out one synchronization run that re-homes and pushes the offline data

#### Scenario: A restored session without a request does not synchronize
- **WHEN** an existing session is restored on application start and no synchronization request is remembered
- **THEN** the Pod container base is resolved
- **AND** no synchronization run is started

### Requirement: Synchronization runs only on an explicit user request
The system SHALL start a synchronization run only when the user invokes the manual sync action, or as the deferred completion of such an invocation. Restoring a session, reloading the application, and regaining network connectivity SHALL NOT start a synchronization run by themselves.

#### Scenario: Reloading the application does not synchronize
- **WHEN** the user reloads the application and an existing Solid session is restored
- **THEN** no synchronization run is started
- **AND** the application remains fully usable from local storage

#### Scenario: Regaining connectivity without a requested sync does not synchronize
- **WHEN** the device transitions from offline to online with a valid session and no outstanding sync request
- **THEN** no synchronization run is started

### Requirement: A requested sync that cannot run yet is remembered
The system SHALL record, in device-local storage that survives a page unload, that the user requested a synchronization which has not been carried out — either because there was no session (the manual action starts the login flow, which navigates away from the application) or because the run failed. A remembered request SHALL be kept while it cannot be served, namely while there is no valid session or the Pod container base is not resolved. Once it can be served, the system SHALL clear the record before starting the run, so that a run which keeps failing is not replayed on every application start. A remembered request SHALL result in at most one synchronization run.

#### Scenario: Sync pressed while logged out is completed after login
- **WHEN** a logged-out user invokes the manual sync action, completes the login flow, and returns to the application
- **THEN** the remembered request is carried out as one synchronization run
- **AND** the request is no longer remembered afterwards, so a later reload does not synchronize again

#### Scenario: Sync pressed while offline is completed on reconnect
- **WHEN** the user invokes the manual sync action while offline and the run fails
- **AND** the device later transitions from offline to online with a valid session
- **THEN** the remembered request is carried out as one synchronization run

#### Scenario: The request is kept while it cannot be served
- **WHEN** a request is remembered and the application starts without a valid session, or with a session but without a resolved Pod container base
- **THEN** no synchronization run is started
- **AND** the request stays remembered, so it is carried out once a session and a resolved container base exist

#### Scenario: An abandoned login leaves the request outstanding
- **WHEN** a logged-out user invokes the manual sync action and does not complete the login flow
- **THEN** no synchronization run is started
- **AND** the request is carried out at the next application start that has a valid session

### Requirement: Single-flight coordination
The system SHALL run at most one synchronization at a time and SHALL coalesce triggers that occur during an in-flight run into a single subsequent run.

#### Scenario: Trigger during an in-flight sync
- **WHEN** a sync is already running and another trigger (manual or on-reconnect) fires
- **THEN** the system does not start a concurrent sync and instead performs exactly one follow-up run after the current one completes

### Requirement: Pod container location
The system SHALL store its Pod data under the container base `{storageRoot}private/kellermeister/v1/`, where `{storageRoot}` is the user's Pod storage root. On first resolution the system SHALL provision that base and its per-collection subcontainers (`cellars/`, `bottles/`, `products/`, `orders/`). Synchronization SHALL read and write the tracked collections under this base. A persisted container base that does not belong to the current container version SHALL be discarded rather than used.

#### Scenario: Container base is resolved under private/kellermeister/v1
- **WHEN** the container is resolved for a storage root of `https://alice.pod/`
- **THEN** the container base is `https://alice.pod/private/kellermeister/v1/`
- **AND** the per-collection subcontainers `cellars/`, `bottles/`, `products/`, `orders/` exist under that base

#### Scenario: A persisted base from an earlier container layout is ignored
- **WHEN** the app starts on a device whose persisted container base predates this layout (e.g. `https://alice.pod/kellermeister/`)
- **THEN** that base is discarded and the system behaves as if no base had been resolved yet
- **AND** nothing is synced into the earlier container, and no inbox path is derived from it

### Requirement: Multi-collection container sweep
Synchronization SHALL reconcile each tracked collection (`cellars`, `bottles`, `products`, `orders`) by unioning local and remote resources by URL: resources present on both sides are merged via operation-log synchronization and persisted on both; live resources present only locally are created on the Pod; live resources present only remotely are created locally.

#### Scenario: Local-only bottle is pushed
- **WHEN** a bottle exists locally but not on the Pod and is not soft-deleted
- **THEN** synchronization creates it on the Pod

#### Scenario: Remote-only product is pulled
- **WHEN** a product exists on the Pod but not locally and is not soft-deleted
- **THEN** synchronization creates it locally

### Requirement: Conflict resolution via operation-log merge
The system SHALL reconcile local and remote state by merging their CRDT operation logs, applying Last-Write-Wins per property using operation timestamps, so that all devices converge to the same state.

#### Scenario: Same property edited on two devices
- **WHEN** the same property of a resource was changed on two devices while offline and both later sync
- **THEN** the value with the latest operation timestamp wins and both the local store and the Pod converge to that value

### Requirement: Cross-device deletion propagation
Deleting a synced resource SHALL propagate to the Pod and to other devices via a retained soft-delete marker merged during synchronization. A deleted resource MUST NOT be resurrected by a later sync.

#### Scenario: Delete on one device removes it from another
- **WHEN** a bottle that has already synced is deleted on device A, and device B later syncs
- **THEN** the bottle becomes deleted on device B and is not resurrected on any subsequent sync

### Requirement: Sync status reporting
The system SHALL expose synchronization status to the UI, including at least the states `idle`, `syncing`, and `error`, and the time of the last successful synchronization.

#### Scenario: Status transitions on a successful run
- **WHEN** a synchronization run starts and then completes successfully
- **THEN** the status transitions from `idle` to `syncing` to `idle` and the last-successful-sync time is updated

#### Scenario: Status reflects failure
- **WHEN** a synchronization run fails (for example, the network drops mid-sync)
- **THEN** the status is set to `error` and local data remains intact and unchanged
