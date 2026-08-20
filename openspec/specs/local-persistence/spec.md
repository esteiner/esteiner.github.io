# local-persistence Specification

## Purpose

Kellermeister is local-first: users must be able to create and read cellars, bottles, products, and orders without an authenticated Solid session. All data is persisted locally in IndexedDB through repositories that never reach the network, and the dependency-injection container constructs those repositories and the application service at startup without a resolved Pod `storageUrl`. Root models are CRDT-ready — carrying timestamps, operation history, and soft deletes — so that synchronization can later merge operation logs and propagate deletions, while soft-deleted records stay hidden from the UI yet retained for sync.

## Requirements

### Requirement: Offline creation without login
The system SHALL allow a user to create and read cellars, bottles, products, and orders without an authenticated Solid session. All such data SHALL be persisted locally in IndexedDB and remain available offline.

#### Scenario: Create a cellar with no session
- **WHEN** a user who has never logged in creates a cellar
- **THEN** the cellar is persisted to IndexedDB and appears in the cellar list without any network request

#### Scenario: Data survives reload while logged out
- **WHEN** a logged-out user creates bottles and later reloads the app
- **THEN** the previously created bottles are read back from IndexedDB and displayed

### Requirement: Local-only repositories
Repositories SHALL read from and write to IndexedDB exclusively and SHALL NOT reach the network. The global Soukai engine SHALL be an `IndexedDBEngine`; the `SolidEngine` SHALL be used only within the synchronization layer via a scoped `withEngine`.

#### Scenario: Repository operations never block on the network
- **WHEN** any repository read or write is performed while the device is offline
- **THEN** the operation completes against IndexedDB without error and without a network call

### Requirement: Repositories constructible without a storage URL
The dependency-injection container SHALL construct all repositories and the application service at startup without requiring a resolved Pod `storageUrl`.

#### Scenario: Services available before login
- **WHEN** the app starts and no session has been restored
- **THEN** the application service and its repositories are available and usable

### Requirement: CRDT-ready root models
The `Cellar`, `Bottle`, `Product`, and `Order` models SHALL enable timestamps, operation history, and soft deletes so that synchronization can merge operation logs and propagate deletions.

#### Scenario: Update preserves operation history
- **WHEN** a tracked model is loaded and an updated field is applied onto it and saved
- **THEN** the model's operation log grows to include the new operation rather than being reset

### Requirement: Soft-deleted records hidden from reads
Reads exposed to the UI (`findAll` / `findById` equivalents) SHALL exclude soft-deleted records, while the underlying record is retained for synchronization.

#### Scenario: Deleted bottle disappears from the UI but is retained locally
- **WHEN** a bottle is deleted
- **THEN** it no longer appears in any cellar view, but its soft-deleted record remains in IndexedDB for later sync

### Requirement: Session metadata persists locally in IndexedDB
The system SHALL persist two singleton session-metadata values in IndexedDB: the WebID used to authenticate, and the date of the last successful synchronization. The WebID SHALL be stored when an authenticated session is established (login or session restore). The last successful sync date SHALL be stored whenever a synchronization run completes successfully. Both values SHALL survive a reload and SHALL be readable offline and before any session is restored. This metadata is local-only device state and SHALL NOT be synced to the Pod.

#### Scenario: Last sync date survives a reload
- **WHEN** a synchronization completes successfully and the user later reloads the app
- **THEN** the persisted last sync date is read back from IndexedDB and shown as the last-sync time (not reset to "no sync yet")

#### Scenario: WebID is stored on login and readable offline
- **WHEN** a user establishes an authenticated session and later reloads or opens the app without a live session
- **THEN** the WebID used is read back from IndexedDB and available for display

#### Scenario: No metadata stored yet
- **WHEN** the app starts and no WebID or sync has ever been recorded
- **THEN** reading the persisted WebID and last sync date yields no value and no error is raised

#### Scenario: Metadata is not synced to the Pod
- **WHEN** a synchronization run reconciles the tracked collections
- **THEN** the locally stored WebID and last sync date are not written to the Pod
