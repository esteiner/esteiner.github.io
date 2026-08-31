## ADDED Requirements

### Requirement: RDF persistence is provided by soukai-bis

The application SHALL persist domain aggregates as RDF using the `soukai-bis` library and its Solid integration, replacing `soukai` + `soukai-solid`. All model schemas SHALL be declared with `soukai-bis`'s `defineSchema` and Zod validators; the legacy `defineSolidModelSchema` + `FieldType` DSL SHALL NOT be used.

#### Scenario: Models boot on the soukai-bis API
- **WHEN** the application (or a test) initializes the data layer
- **THEN** models are booted via the `soukai-bis` boot API (e.g. `bootCoreModels`/`bootModels`) with the `soukai-bis/patch-zod` side-effect applied
- **AND** no import path references `soukai-solid` or the `soukai` `FieldType` DSL

#### Scenario: Schemas declare fields with Zod validators
- **WHEN** a `*.schema.ts` defines a model's fields
- **THEN** each field is declared with a Zod validator (`string()`, `number()`, `url()`, `array()`, …) via `defineSchema`
- **AND** the field's RDF property, RDF class, and RDF contexts resolve to the same IRIs as before the migration

### Requirement: Existing persistence behavior is preserved across the migration

The migration SHALL be behavior-preserving. Field-to-RDF mappings, required/optional semantics, `timestamps`, operation-log `history`, and soft-delete behavior SHALL be equivalent to the pre-migration models so that data written by the previous version remains readable and vice versa.

#### Scenario: Existing Pod/IndexedDB data remains readable
- **WHEN** a resource previously written by the `soukai-solid` version is loaded after the upgrade
- **THEN** its fields deserialize to the same domain values
- **AND** its RDF type and property IRIs are unchanged

#### Scenario: Soft deletes and history still function
- **WHEN** a soft-deletable model (e.g. Cellar) is deleted and later synced
- **THEN** the deletion is recorded via the operation log and propagates across devices exactly as before the migration

### Requirement: Local-first engine topology is retained

The application SHALL keep the local-first engine topology: an IndexedDB engine installed as the global engine for all ordinary reads/writes, and a `soukai-bis` Solid engine used only within scoped sync operations. The engine-scoping serialization (`withLocalEngine`/`withRemoteEngine`) SHALL continue to guarantee at most one engine-scoped operation in flight.

#### Scenario: Ordinary reads use the local engine
- **WHEN** a repository reads or writes a resource outside of sync
- **THEN** the operation runs against the global IndexedDB engine and never issues a network request

#### Scenario: Synchronization uses a scoped Solid engine
- **WHEN** the sync layer reconciles local state with the Pod
- **THEN** it runs within a scoped Solid engine and restores the global IndexedDB engine when the scope settles
