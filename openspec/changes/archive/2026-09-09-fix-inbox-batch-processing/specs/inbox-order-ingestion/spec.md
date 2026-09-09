## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: Ingest inbox orders into the cellarwork cellar on page open

When the cellarwork page is opened by a logged-in user, the system SHALL ingest each unprocessed order into the `cellarwork` cellar: for every order item with a quantity, the product SHALL be persisted and one bottle SHALL be created per ordered unit, each bottle placed in the `cellarwork` cellar. When the inbox holds multiple unprocessed orders, the system SHALL process all of them as one batch and create the bottles for the whole batch before the cellarwork contents are presented as complete.

#### Scenario: Orders become products and bottles in cellarwork
- **WHEN** the cellarwork page opens and there is one unprocessed order with an item of quantity 3
- **THEN** the item's product is saved
- **AND** 3 bottles referencing that product are created in the cellarwork cellar

#### Scenario: Multiple inbox orders are ingested as one batch
- **WHEN** the cellarwork page opens and the inbox holds several unprocessed orders
- **THEN** every order's products are saved and its bottles created in the cellarwork cellar
- **AND** the displayed cellarwork contents reflect the bottles from all of the orders, not a subset

#### Scenario: Nothing to ingest
- **WHEN** the cellarwork page opens and the inbox has no unprocessed orders
- **THEN** no products or bottles are created and the page shows the existing cellarwork contents
