## MODIFIED Requirements

### Requirement: Read unprocessed orders from the Pod inbox

The system SHALL read unprocessed orders from the Pod inbox container located at `{storageRoot}inbox/kellermeister/`, where `{storageRoot}` is the user's storage root derived from the resolved Pod container base. Reading MUST use the authenticated Solid session (the inbox is a Pod resource, not local storage), and each returned order MUST have its embedded seller, customer, and positions (order items) loaded so it can be ingested.

Every part of an inbox order — the order, its order items, the product referenced by each item, the seller, the customer, and the customer's contactPoint — is embedded in the single inbox document. The system SHALL materialize those parts from that document's RDF graph, correlating them by their subject identifiers. An embedded resource's identifier SHALL be treated as opaque: the system MUST NOT issue a network request to dereference it, regardless of its host (real inbox identifiers are synthetic absolute URLs such as `https://kellermeister.ch/orders/1004727/1` that are not dereferenceable and whose foreign origin would otherwise be blocked by CORS).

#### Scenario: Unprocessed orders are read from the inbox
- **WHEN** unprocessed orders are requested and the user is logged in with a resolved Pod base
- **THEN** every order resource in `{storageRoot}inbox/kellermeister/` is returned
- **AND** each order's seller, customer, and order items are populated

#### Scenario: Embedded parts are resolved from the document without dereferencing their identifiers
- **WHEN** an inbox order embeds its order item, product, seller, and customer as subjects identified by foreign absolute URLs (e.g. `https://kellermeister.ch/orders/1004727/1`, `https://www.boucherville.ch`) within the one inbox document
- **THEN** each part is materialized from the inbox document's graph by matching its subject
- **AND** no network request is issued to any embedded resource's identifier
- **AND** each order item exposes its product (so `getProduct()` returns the embedded product, not an unresolved reference)

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

### Requirement: Processed orders are stored locally and removed from the inbox

After an order is ingested, the system SHALL store the freshly-built processed order — with its seller, customer, and all order items embedded in the same document — in local storage (to be re-homed to the Pod on the next sync) and SHALL delete its source document from the Pod inbox using the authenticated session, so the same order is not ingested again. The inbox deletion MUST be performed via the order repository (the owner of Pod-inbox access), not directly from the application service with an unauthenticated fetch.

The deletion SHALL target the inbox **document** the order was read from — not an identifier derived from the order resource. An inbox order's own identifier is a synthetic, non-dereferenceable URL (e.g. `https://kellermeister.ch/orders/1004727`) distinct from the inbox document URL; deleting that identifier would issue a cross-origin, CORS-blocked request to a non-existent resource. The repository therefore tracks each unprocessed order's source document URL when reading the inbox and deletes that URL.

When the locally-stored order is re-homed to the Pod during sync, the system SHALL preserve its embedded seller, customer, and order items in the re-homed document, and SHALL re-home each order item's cross-resource product reference to the corresponding Pod product URL. A reconstruction that copies only the order's own attributes (dropping the embedded related models) is not sufficient.

#### Scenario: The inbox document is deleted, not the order's identifier
- **WHEN** an order whose subject identifier is a foreign absolute URL (e.g. `https://kellermeister.ch/orders/1004727`) has been ingested
- **THEN** the delete targets the inbox document the order was read from (the file in `{storageRoot}inbox/kellermeister/`)
- **AND** no request is made to the order's synthetic identifier

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
