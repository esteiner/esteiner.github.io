# inbox-order-ingestion Specification

## Purpose

Kellermeister ingests orders delivered to the user's Solid Pod inbox and turns them into cellar contents. Because the inbox lives in the Pod, ingestion is online-only: it requires an authenticated session and a resolved Pod base, and yields nothing otherwise. When the cellarwork page opens for a logged-in user, each unprocessed inbox order becomes persisted products and one bottle per ordered unit in the `cellarwork` cellar. Processed orders are then stored locally and removed from the Pod inbox so they are never ingested twice.

## Requirements

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

### Requirement: Inbox ingestion is online-only

Reading unprocessed orders SHALL require an authenticated session and a resolved Pod base. When the user is logged out, or the Pod base has not yet been resolved, the system MUST return an empty list of unprocessed orders and MUST NOT throw.

#### Scenario: Logged out yields no unprocessed orders
- **WHEN** unprocessed orders are requested and no authenticated session exists
- **THEN** an empty list is returned and no error is raised

#### Scenario: Pod base not yet resolved yields no unprocessed orders
- **WHEN** unprocessed orders are requested and the Pod container base is not yet resolved
- **THEN** an empty list is returned and no error is raised

### Requirement: Ingest inbox orders into the cellarwork cellar on page open

When the cellarwork cellar is opened by a logged-in user — in its **normal bottle view** or in the specialized work display — the system SHALL ingest each unprocessed order into the `cellarwork` cellar: for every order item with a quantity, the product SHALL be persisted and one bottle SHALL be created per ordered unit, each bottle placed in the `cellarwork` cellar. When the inbox holds multiple unprocessed orders, the system SHALL process all of them as one batch and create the bottles for the whole batch before the contents are presented as complete. Because ingestion is single-flight and idempotent, opening either view triggers it safely without double-processing.

#### Scenario: Orders become products and bottles in cellarwork
- **WHEN** the cellarwork cellar is opened and there is one unprocessed order with an item of quantity 3
- **THEN** the item's product is saved
- **AND** 3 bottles referencing that product are created in the cellarwork cellar

#### Scenario: Multiple inbox orders are ingested as one batch
- **WHEN** the cellarwork cellar is opened and the inbox holds several unprocessed orders
- **THEN** every order's products are saved and its bottles created in the cellarwork cellar
- **AND** the displayed contents reflect the bottles from all of the orders, not a subset

#### Scenario: Ingestion runs from the normal cellarwork view
- **WHEN** the cellarwork cellar is opened in its normal bottle view and the inbox holds unprocessed orders
- **THEN** those orders are ingested and their bottles appear in the listed contents

#### Scenario: Nothing to ingest
- **WHEN** the cellarwork cellar is opened and the inbox has no unprocessed orders
- **THEN** no products or bottles are created and the view shows the existing cellarwork contents

### Requirement: Processed orders are stored locally and removed from the inbox

After an order is ingested, the system SHALL store the freshly-built processed order — with its seller, customer, and all order items embedded in the same document — in local storage (to be re-homed to the Pod on the next sync) and SHALL delete its source document from the Pod inbox using the authenticated session, so the same order is not ingested again. The inbox deletion MUST be performed via the order repository (the owner of Pod-inbox access), not directly from the application service with an unauthenticated fetch.

The deletion SHALL target the inbox **document** the order was read from — not an identifier derived from the order resource. An inbox order's own identifier is a synthetic, non-dereferenceable URL (e.g. `https://kellermeister.ch/orders/1004727`) distinct from the inbox document URL; deleting that identifier would issue a cross-origin, CORS-blocked request to a non-existent resource.

Each unprocessed order's source-document URL SHALL be carried with the order itself (associated with that specific order at read time), so deletion resolves the correct document regardless of any subsequent or overlapping inbox read. The system MUST NOT depend on shared, mutable repository state (such as a single map that is cleared and rebuilt on every inbox read) to locate the document to delete, because an overlapping read would clear it and cause deletions to be skipped — leaving bottles created but inbox documents undeleted.

When the locally-stored order is re-homed to the Pod during sync, the system SHALL preserve its embedded seller, customer, and order items in the re-homed document, and SHALL re-home each order item's cross-resource product reference to the corresponding Pod product URL. A reconstruction that copies only the order's own attributes (dropping the embedded related models) is not sufficient.

#### Scenario: The inbox document is deleted, not the order's identifier
- **WHEN** an order whose subject identifier is a foreign absolute URL (e.g. `https://kellermeister.ch/orders/1004727`) has been ingested
- **THEN** the delete targets the inbox document the order was read from (the file in `{storageRoot}inbox/kellermeister/`)
- **AND** no request is made to the order's synthetic identifier

#### Scenario: Source document is deleted with the authenticated fetch
- **WHEN** an order read from the inbox has been ingested
- **THEN** the freshly-built order (embedding its seller, customer, and order items) is saved locally
- **AND** its source document is deleted from the inbox using the authenticated session fetch

#### Scenario: Every processed order's document is deleted when the inbox holds several files
- **WHEN** the inbox holds several order documents and all are ingested
- **THEN** each processed order's own source document is deleted (resolved per order, not via shared repository state)
- **AND** after the batch completes no processed order's document remains in the inbox

#### Scenario: Deletion is unaffected by an overlapping inbox read
- **WHEN** the inbox is read again while a batch ingestion is still deleting the documents from a prior read
- **THEN** each order still resolves to the correct source document to delete
- **AND** no processed order's document is left in the inbox because its source URL was lost

#### Scenario: Ingested orders are not re-ingested on the next visit
- **WHEN** the cellarwork page is opened again after a successful ingestion
- **THEN** the previously ingested order is no longer present in the inbox and is not ingested a second time

#### Scenario: Embedded parts survive re-homing to the Pod
- **WHEN** a locally-stored order that embeds a seller, a customer, and order items is synced to the Pod
- **THEN** the re-homed Pod order still embeds its seller, its customer, and all of its order items in one document
- **AND** each order item references the re-homed Pod product URL (not the provisional `local://` URL)
- **AND** running sync again is idempotent (no duplicate order, embedded parts preserved)

### Requirement: Inbox ingestion is single-flight

The system SHALL ensure that at most one inbox ingestion runs at a time. While an ingestion is in progress, any additional trigger (a second cellarwork page open, a filter interaction that re-runs the bottles task, or any other caller of the ingestion use case) MUST await the in-flight ingestion and observe its result, rather than starting a concurrent ingestion. A concurrent read of the inbox MUST NOT corrupt an in-flight ingestion's ability to delete the documents it processed.

#### Scenario: A second trigger during ingestion does not start a concurrent run
- **WHEN** an ingestion is in progress for an inbox holding several orders
- **AND** a second ingestion trigger fires before the first completes
- **THEN** the second trigger awaits the in-flight ingestion and resolves to the same completed result
- **AND** the inbox is read and its documents deleted exactly once per order

#### Scenario: No duplicate bottles from overlapping triggers
- **WHEN** two ingestion triggers fire for the same inbox contents
- **THEN** each ordered unit produces exactly one bottle (no order is ingested twice)

### Requirement: Batch inbox ingestion is atomic for display

When the cellarwork page ingests the inbox, the system SHALL create bottles and render the cellarwork contents only after **every** unprocessed inbox order has been processed **and** every corresponding inbox source document has been deleted. The page MUST NOT display a partially-ingested cellar as though ingestion had completed. If ingestion fails part-way through, the page MUST surface an error/retry state rather than presenting the partial result as the final cellarwork contents; orders already persisted locally are never lost, and the inbox retains any documents whose orders were not yet processed so they are ingested on a later attempt.

#### Scenario: Contents shown only after the whole inbox is drained
- **WHEN** the cellarwork page opens with multiple unprocessed orders in the inbox
- **THEN** no bottles are displayed until all orders are processed and all their inbox documents are deleted
- **AND** once complete, the page shows exactly the bottles produced by the full batch

#### Scenario: Partial failure does not render a partial cellar
- **WHEN** ingestion processes some orders and then fails before the inbox is fully drained
- **THEN** the page does not present the partially-ingested cellar as the completed result
- **AND** orders already persisted locally remain saved
- **AND** the inbox still contains the documents for the orders that were not processed, so they can be ingested on the next attempt
