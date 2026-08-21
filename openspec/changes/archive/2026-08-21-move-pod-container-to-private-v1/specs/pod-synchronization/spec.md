## ADDED Requirements

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
