## MODIFIED Requirements

### Requirement: Local-only repositories
Repositories SHALL read from and write to IndexedDB exclusively and SHALL NOT reach the network. The global Soukai engine SHALL be an `IndexedDBEngine`; the `SolidEngine` SHALL be used only within the synchronization layer and the Pod inbox read.

Because the Soukai engine is global state that is swapped for the duration of a scoped operation, engine access SHALL be serialized: at most one engine-scoped operation SHALL be in flight at any time. A local operation SHALL therefore reach the local engine, and a Pod operation SHALL reach the intended Pod engine, irrespective of what runs concurrently. After any engine-scoped operation completes — successfully or not — the global engine SHALL be the one that was installed before it.

#### Scenario: Repository operations never block on the network
- **WHEN** any repository read or write is performed while the device is offline
- **THEN** the operation completes against IndexedDB without error and without a network call

#### Scenario: A local read during a Pod operation stays local
- **WHEN** a repository read is issued while the synchronization layer or the inbox read is operating against the Pod
- **THEN** the read is served by the local engine
- **AND** no local container (a `local://…` or re-homed Pod container read from IndexedDB) is requested from the Pod

#### Scenario: A failed Pod operation leaves the local engine installed
- **WHEN** an operation scoped to a Pod engine fails
- **THEN** the global engine is the local `IndexedDBEngine` again
- **AND** subsequent repository reads and writes are served locally

#### Scenario: A failed operation does not block later engine access
- **WHEN** an engine-scoped operation fails
- **THEN** the failure is reported to its own caller
- **AND** operations queued behind it still run
