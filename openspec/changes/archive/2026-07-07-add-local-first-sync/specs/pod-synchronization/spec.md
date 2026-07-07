## ADDED Requirements

### Requirement: Manual synchronization
The system SHALL provide a manual action that triggers synchronization between local storage and the Solid Pod.

#### Scenario: Manual sync when online and authenticated
- **WHEN** the user invokes the manual sync action while online with a valid Solid session
- **THEN** the system pulls, merges, and pushes all tracked collections and updates the sync status to reflect completion

#### Scenario: Manual sync without a session
- **WHEN** the user invokes the manual sync action with no valid session
- **THEN** the system does not sync and surfaces a not-authenticated condition so the UI can prompt for login

### Requirement: On-reconnect synchronization
The system SHALL automatically trigger synchronization when network connectivity is restored, provided a valid Solid session exists.

#### Scenario: Connectivity restored with a valid session
- **WHEN** the device transitions from offline to online and a valid session exists
- **THEN** the system automatically triggers a synchronization run

#### Scenario: Connectivity restored without a session
- **WHEN** the device transitions from offline to online but no valid session exists
- **THEN** the system skips synchronization silently without prompting for login

### Requirement: Post-login synchronization
After a successful login, the system SHALL trigger a synchronization run rather than gating application usability on session establishment.

#### Scenario: First login after offline use
- **WHEN** a user who created data offline logs in successfully
- **THEN** the system resolves the Pod container base and triggers a sync that re-homes and pushes the offline data

### Requirement: Single-flight coordination
The system SHALL run at most one synchronization at a time and SHALL coalesce triggers that occur during an in-flight run into a single subsequent run.

#### Scenario: Trigger during an in-flight sync
- **WHEN** a sync is already running and another trigger (manual or on-reconnect) fires
- **THEN** the system does not start a concurrent sync and instead performs exactly one follow-up run after the current one completes

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
