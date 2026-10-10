# product-source-display Specification

## Purpose

Kellermeister shows, in the product detail view, where a product came from — the name of the seller of the order it was ingested from (its "Quelle"), together with the order date. This is backed by a persisted, sync-safe link from a product back to its order item (and thus its order and seller), which is loaded when products are presented so the source resolves without a per-render fetch.

## Requirements

### Requirement: Product detail view shows the order's seller as its source

The product detail view (`product-component`, "Quelle") SHALL display the **name of the seller** of the order the product came from, together with the order date. When the seller name is not available, the view SHALL instead display the order item's **price source**, if present. The field MAY be empty only when neither a seller name nor a price source is available.

#### Scenario: Seller name is shown for an ingested product
- **WHEN** a product that was ingested from an order (with a seller) is shown in the product detail view
- **THEN** the "Quelle" line shows the seller's name (and the order date), not an empty value

#### Scenario: Seller name takes precedence over price source
- **WHEN** a product's order has a seller with a name and its order item also has a price source
- **THEN** the "Quelle" line shows the seller's name, not the price source

#### Scenario: Price source is shown when the seller name is missing
- **WHEN** a product's order has no seller (or the seller has no name) but its order item has a price source
- **THEN** the "Quelle" line shows the price source (and the order date, if present)

#### Scenario: No associated order
- **WHEN** a product has no associated order item, or neither a seller name nor a price source is available
- **THEN** the "Quelle" line shows no source name and no error occurs

### Requirement: A product retains a resolvable link to its order and seller

An ingested product SHALL persist a link to its order item such that, on read, the chain product → order item → order → seller resolves. The stored link SHALL reference the order item's **final persisted identifier** (not a provisional/empty URL captured before the order document was saved). The system SHALL load this reverse chain when presenting products in the views that show the source (the cellar view and the order view).

#### Scenario: The reverse link is persisted with a stable identifier
- **WHEN** an order is ingested (its order, order items, seller, and products are persisted)
- **THEN** each product's stored order-item reference points at that order item's final persisted URL
- **AND** reading the product resolves its order item, that item's order, and the order's seller

#### Scenario: The link survives re-homing to the Pod
- **WHEN** a locally-ingested order and its products are synced (re-homed) to the Pod
- **THEN** the product ↔ order-item reference is remapped to the Pod URLs on both sides
- **AND** after sync the product still resolves its order item → order → seller

#### Scenario: Reverse chain is loaded for display
- **WHEN** products are read for the cellar view (via their bottles) or the order view (via order items)
- **THEN** each product's order item → order → seller relations are loaded so the source can be shown without an additional per-product fetch at render time
