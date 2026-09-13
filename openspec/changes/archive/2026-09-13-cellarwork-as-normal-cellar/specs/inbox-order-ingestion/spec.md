## MODIFIED Requirements

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
