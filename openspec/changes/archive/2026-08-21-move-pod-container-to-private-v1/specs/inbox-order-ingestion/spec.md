## MODIFIED Requirements

### Requirement: Read unprocessed orders from the Pod inbox

The system SHALL read unprocessed orders from the Pod inbox container located at `{storageRoot}inbox/kellermeister/`, where `{storageRoot}` is the user's storage root derived from the resolved Pod container base. Reading MUST use the authenticated Solid session (the inbox is a Pod resource, not local storage), and each returned order MUST have its embedded seller, customer, and positions (order items) loaded so it can be ingested.

#### Scenario: Unprocessed orders are read from the inbox
- **WHEN** unprocessed orders are requested and the user is logged in with a resolved Pod base
- **THEN** every order resource in `{storageRoot}inbox/kellermeister/` is returned
- **AND** each order's seller, customer, and order items are populated

#### Scenario: Inbox path is derived from the storage root
- **WHEN** the Pod container base is `https://alice.pod/private/kellermeister/v1/`
- **THEN** the storage root is `https://alice.pod/`
- **AND** the inbox container read is `https://alice.pod/inbox/kellermeister/`

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
