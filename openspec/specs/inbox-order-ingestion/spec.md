# inbox-order-ingestion Specification

## Purpose

Kellermeister ingests orders delivered to the user's Solid Pod inbox and turns them into cellar contents. Because the inbox lives in the Pod, ingestion is online-only: it requires an authenticated session and a resolved Pod base, and yields nothing otherwise. When the cellarwork page opens for a logged-in user, each unprocessed inbox order becomes persisted products and one bottle per ordered unit in the `cellarwork` cellar. Processed orders are then stored locally and removed from the Pod inbox so they are never ingested twice.

## Requirements

### Requirement: Read unprocessed orders from the Pod inbox

The system SHALL read unprocessed orders from the Pod inbox container located at `{storageRoot}inbox/kellermeister/`, where `{storageRoot}` is the user's storage root derived from the resolved Pod container base. Reading MUST use the authenticated Solid session (the inbox is a Pod resource, not local storage), and each returned order MUST have its embedded seller and positions (order items) loaded so it can be ingested.

#### Scenario: Unprocessed orders are read from the inbox
- **WHEN** unprocessed orders are requested and the user is logged in with a resolved Pod base
- **THEN** every order resource in `{storageRoot}inbox/kellermeister/` is returned
- **AND** each order's seller and order items are populated

#### Scenario: Inbox path is derived from the storage root
- **WHEN** the Pod container base is `https://alice.pod/kellermeister/`
- **THEN** the inbox container read is `https://alice.pod/inbox/kellermeister/`

### Requirement: Inbox ingestion is online-only

Reading unprocessed orders SHALL require an authenticated session and a resolved Pod base. When the user is logged out, or the Pod base has not yet been resolved, the system MUST return an empty list of unprocessed orders and MUST NOT throw.

#### Scenario: Logged out yields no unprocessed orders
- **WHEN** unprocessed orders are requested and no authenticated session exists
- **THEN** an empty list is returned and no error is raised

#### Scenario: Pod base not yet resolved yields no unprocessed orders
- **WHEN** unprocessed orders are requested and the Pod container base is not yet resolved
- **THEN** an empty list is returned and no error is raised

### Requirement: Ingest inbox orders into the cellarwork cellar on page open

When the cellarwork page is opened by a logged-in user, the system SHALL ingest each unprocessed order into the `cellarwork` cellar: for every order item with a quantity, the product SHALL be persisted and one bottle SHALL be created per ordered unit, each bottle placed in the `cellarwork` cellar.

#### Scenario: Orders become products and bottles in cellarwork
- **WHEN** the cellarwork page opens and there is one unprocessed order with an item of quantity 3
- **THEN** the item's product is saved
- **AND** 3 bottles referencing that product are created in the cellarwork cellar

#### Scenario: Nothing to ingest
- **WHEN** the cellarwork page opens and the inbox has no unprocessed orders
- **THEN** no products or bottles are created and the page shows the existing cellarwork contents

### Requirement: Processed orders are stored locally and removed from the inbox

After an order is ingested, the system SHALL store the processed order in local storage (to be re-homed to the Pod on the next sync) and SHALL delete its source document from the Pod inbox using the authenticated session, so the same order is not ingested again. The inbox deletion MUST be performed via the order repository (the owner of Pod-inbox access), not directly from the application service with an unauthenticated fetch.

#### Scenario: Source document is deleted with the authenticated fetch
- **WHEN** an order read from the inbox has been ingested
- **THEN** its processed copy is saved locally
- **AND** its source document is deleted from the inbox using the authenticated session fetch

#### Scenario: Ingested orders are not re-ingested on the next visit
- **WHEN** the cellarwork page is opened again after a successful ingestion
- **THEN** the previously ingested order is no longer present in the inbox and is not ingested a second time
