# Spec Delta

## MODIFIED Requirements

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
