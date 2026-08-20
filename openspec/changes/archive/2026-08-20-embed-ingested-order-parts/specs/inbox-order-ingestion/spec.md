## ADDED Requirements

### Requirement: Order, seller, customer, and order items persist in one document

When an ingested order is persisted, the system SHALL store the order together with its seller, its customer (the object referenced by `schema:customer`), and all of its order items in the **same RDF document** (a single Turtle resource), using same-document relationships. The persisted order MUST be the freshly-built order produced during ingestion — whose order items reference the newly-created local products — not the raw inbox order.

#### Scenario: All order parts are embedded in the order document
- **WHEN** an inbox order with a seller, a customer, and two order items is ingested
- **THEN** the persisted order, its seller, its customer, and both order items reside in one document (they share the order's document URL)
- **AND** the persisted order's items reference the newly-created local products, not the inbox product URLs

#### Scenario: Customer is carried over from the source order
- **WHEN** the source inbox order has an object referenced by `schema:customer`
- **THEN** the persisted order exposes that customer via its customer relationship
- **AND** the customer is stored inside the order document

#### Scenario: Missing customer is tolerated
- **WHEN** the source inbox order has no `schema:customer`
- **THEN** the order is persisted without a customer and no error is raised

## MODIFIED Requirements

### Requirement: Read unprocessed orders from the Pod inbox

The system SHALL read unprocessed orders from the Pod inbox container located at `{storageRoot}inbox/kellermeister/`, where `{storageRoot}` is the user's storage root derived from the resolved Pod container base. Reading MUST use the authenticated Solid session (the inbox is a Pod resource, not local storage), and each returned order MUST have its embedded seller, customer, and positions (order items) loaded so it can be ingested.

#### Scenario: Unprocessed orders are read from the inbox
- **WHEN** unprocessed orders are requested and the user is logged in with a resolved Pod base
- **THEN** every order resource in `{storageRoot}inbox/kellermeister/` is returned
- **AND** each order's seller, customer, and order items are populated

#### Scenario: Inbox path is derived from the storage root
- **WHEN** the Pod container base is `https://alice.pod/kellermeister/`
- **THEN** the inbox container read is `https://alice.pod/inbox/kellermeister/`

#### Scenario: Customer is read when modeled as a schema:Organization
- **WHEN** an inbox order's `schema:customer` references a `schema:Organization` node (the shape the ingestion pipeline produces, mirroring the seller)
- **THEN** the customer relation resolves and the order exposes the customer (it MUST NOT be silently dropped because the model expects a different RDF type)

#### Scenario: Customer name and email are read from the nested contactPoint
- **WHEN** the customer Organization carries its email (and name) on a nested `schema:contactPoint` (a `schema:ContactPoint` node) rather than directly on the Organization
- **THEN** the customer's name and email are taken from the contactPoint (falling back to the Organization's own fields when absent)

#### Scenario: The customer's contactPoint is preserved in the order document and synced
- **WHEN** an ingested order's customer has a `schema:contactPoint`
- **THEN** the persisted order embeds that contactPoint in the same document (order → customer → contactPoint)
- **AND** when the order is re-homed to the Pod during sync, the contactPoint travels with it (it is not dropped or flattened away), so the Pod order exposes the customer's email via its contactPoint

#### Scenario: The customer's address is carried through to the Pod
- **WHEN** the inbox order's customer Organization has a `schema:address`
- **THEN** the persisted order's customer retains that address
- **AND** the address is present on the customer when the order is synced to the Pod

#### Scenario: The seller's url is carried through to the Pod
- **WHEN** the inbox order's seller Organization has a `schema:url`
- **THEN** the persisted order's seller retains that url
- **AND** the url is present on the seller when the order is synced to the Pod

#### Scenario: The product's wine name (km:weinname) is carried through to the Pod
- **WHEN** the inbox order's product has a `km:weinname` (the wine name, distinct from the product's `schema:name`)
- **THEN** the product created during ingestion retains the wine name
- **AND** the wine name is present on the product when it is synced to the Pod

#### Scenario: Reading a persisted order resolves each item's product
- **WHEN** a persisted order is read back from local storage
- **THEN** each of its order items has its product (a separate resource referenced by `productUrl`) resolved, so `getProduct()` returns the product rather than being unresolved

### Requirement: Processed orders are stored locally and removed from the inbox

After an order is ingested, the system SHALL store the freshly-built processed order — with its seller, customer, and all order items embedded in the same document — in local storage (to be re-homed to the Pod on the next sync) and SHALL delete its source document from the Pod inbox using the authenticated session, so the same order is not ingested again. The inbox deletion MUST be performed via the order repository (the owner of Pod-inbox access), not directly from the application service with an unauthenticated fetch.

When the locally-stored order is re-homed to the Pod during sync, the system SHALL preserve its embedded seller, customer, and order items in the re-homed document, and SHALL re-home each order item's cross-resource product reference to the corresponding Pod product URL. A reconstruction that copies only the order's own attributes (dropping the embedded related models) is not sufficient.

#### Scenario: Source document is deleted with the authenticated fetch
- **WHEN** an order read from the inbox has been ingested
- **THEN** the freshly-built order (embedding its seller, customer, and order items) is saved locally
- **AND** its source document is deleted from the inbox using the authenticated session fetch

#### Scenario: Ingested orders are not re-ingested on the next visit
- **WHEN** the cellarwork page is opened again after a successful ingestion
- **THEN** the previously ingested order is no longer present in the inbox and is not ingested a second time

#### Scenario: Embedded parts survive re-homing to the Pod
- **WHEN** a locally-stored order that embeds a seller, a customer, and order items is synced to the Pod
- **THEN** the re-homed Pod order still embeds its seller, its customer, and all of its order items in one document
- **AND** each order item references the re-homed Pod product URL (not the provisional `local://` URL)
- **AND** running sync again is idempotent (no duplicate order, embedded parts preserved)
