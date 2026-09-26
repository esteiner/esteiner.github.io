## ADDED Requirements

### Requirement: A bottle's price is its product's price
The price and currency shown for a bottle SHALL be taken only from the bottle's product. A bottle SHALL NOT have its own price, and the system SHALL NOT read a price or currency stored on a bottle resource.

#### Scenario: Price shown from the product
- **WHEN** a bottle's product has price 32 and currency "CHF"
- **THEN** the bottle row shows "32 CHF"

#### Scenario: Legacy bottle price is ignored
- **WHEN** a bottle resource still contains `schema:price 25` and its product has price 32
- **THEN** the bottle row shows 32, and 25 is not used anywhere

#### Scenario: Product without a price
- **WHEN** a bottle's product has no price, and the bottle resource contains a legacy `schema:price`
- **THEN** no price is shown for the bottle

#### Scenario: Zero price is shown
- **WHEN** a bottle's product has price 0
- **THEN** the bottle row shows 0 with the product's currency
