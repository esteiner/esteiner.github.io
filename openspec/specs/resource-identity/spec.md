# resource-identity Specification

## Purpose

Because Kellermeister creates data offline, every entity needs a stable identity before a Solid Pod is available. Entities created offline receive a provisional identity under a `local://` scheme, and the two well-known cellars use fixed slugs rather than generated uuids. On the first synchronization after login, provisional resources are deterministically and idempotently re-homed to Pod URLs derived from their slugs, with all `local://` reference fields rewritten to the referenced resources' derived Pod URLs. Provisional resources deleted before they ever synced are purged locally rather than written to the Pod.

## Requirements

### Requirement: Provisional local identity
Entities created offline SHALL be assigned a provisional identity under a local scheme of the form `local://<collection>/<uuid>#it`, where `<collection>` is one of `cellars`, `bottles`, `products`, `orders`.

#### Scenario: Bottle created offline gets a provisional id
- **WHEN** a bottle is created while logged out
- **THEN** its identifier begins with `local://bottles/` and contains a generated uuid

### Requirement: Well-known cellar slugs
The two well-known cellars SHALL use fixed slugs instead of a generated uuid: the Altglass cellar SHALL use `local://cellars/altglass#it` and the cellarwork ("Eingang") cellar SHALL use `local://cellars/cellarwork#it`.

#### Scenario: Well-known cellar has a stable provisional id
- **WHEN** the Altglass cellar is materialized offline
- **THEN** its identifier is `local://cellars/altglass#it` regardless of when or how often it is created

### Requirement: Deterministic idempotent re-home
On the first synchronization after login, each provisional resource SHALL be re-homed to a Pod URL derived deterministically from its slug: `<collectionContainer><slug>#it`. Re-homing MUST be idempotent — repeating it MUST resolve to the same Pod URL and MUST NOT create duplicate Pod resources.

#### Scenario: Provisional bottle re-homed on first sync
- **WHEN** a bottle created offline is synced after login
- **THEN** it is written to the Pod under `<bottlesContainer><uuid>#it` and is no longer provisional locally

#### Scenario: Re-home does not duplicate on retry
- **WHEN** synchronization is repeated after an interruption during re-homing
- **THEN** the resource resolves to the same derived Pod URL and no duplicate resource is created

#### Scenario: Well-known cellar re-homes to a stable Pod URL
- **WHEN** the Altglass cellar is re-homed
- **THEN** its Pod URL is `<cellarsContainer>altglass#it` on every device that syncs it

### Requirement: Cross-resource reference rewriting
When a resource is re-homed, every reference field whose value is a `local://` URL SHALL be rewritten to the deterministically-derived Pod URL of the referenced resource, so that references remain valid after independent re-homing. Values already on an `http(s)://` URL SHALL be left unchanged.

#### Scenario: Bottle reference to a product stays valid after re-home
- **WHEN** a bottle referencing a product (`productUrl = local://products/<uuid>#it`) is synced
- **THEN** the bottle's `productUrl` is rewritten to `<productsContainer><uuid>#it`, matching the product's own re-homed URL

#### Scenario: Bottle reference to its cellar stays valid after re-home
- **WHEN** a bottle whose `cellarUrl` points at a well-known cellar slug is synced
- **THEN** the `cellarUrl` is rewritten to that cellar's derived Pod URL

#### Scenario: Rewrite is idempotent
- **WHEN** the reference-rewrite step runs again on an already re-homed resource
- **THEN** the reference values are unchanged

### Requirement: Purge unsynced provisional deletions
A provisional resource that is soft-deleted before it has ever been synced SHALL be purged locally during re-home and SHALL NOT be written to the Pod.

#### Scenario: Bottle created and deleted while offline
- **WHEN** a bottle is created and then deleted before any sync, and the user later logs in and syncs
- **THEN** the bottle is removed from local storage and no corresponding Pod resource is created
