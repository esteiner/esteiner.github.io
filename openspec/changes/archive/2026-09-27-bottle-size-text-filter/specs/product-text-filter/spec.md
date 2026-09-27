## ADDED Requirements

### Requirement: Bottle-size query with "ml <size>"
The text filter SHALL treat an entered text of the form `ml <size>` as a bottle-size query. The match SHALL be case-insensitive, SHALL ignore leading and trailing whitespace, SHALL allow zero or more whitespace characters between `ml` and the size, and SHALL require the size to be a whole number of millilitres with nothing after it. For such a query, a product SHALL match only if its Flaschengrösse (`volumeMl`) equals the entered size. Products without a Flaschengrösse SHALL NOT match. The regular text fields SHALL NOT be searched for a bottle-size query.

#### Scenario: Magnum
- **WHEN** the user enters `ml1500` and a product's Flaschengrösse is 1500
- **THEN** the product matches the text filter

#### Scenario: Different size
- **WHEN** the user enters `ml1500` and a product's Flaschengrösse is 750
- **THEN** the product does not match the text filter

#### Scenario: Product without a bottle size
- **WHEN** the user enters `ml1500` and a product has no Flaschengrösse
- **THEN** the product does not match the text filter

#### Scenario: Case and whitespace variants
- **WHEN** the user enters `ML1500`, `ml 1500` or `  Ml   1500  `
- **THEN** the text is treated as the bottle-size query for 1500 ml

#### Scenario: Other text fields are not searched
- **WHEN** the user enters `ml 750` and a product's name contains `ml 750` but its Flaschengrösse is 1500
- **THEN** the product does not match the text filter

## MODIFIED Requirements

### Requirement: Plain text search ignores the drinking window
For any entered text that is neither a drinking-window query nor a bottle-size query, the text filter SHALL match a product only if the lower-cased text is contained in one of its name, production date, grape variety, alcohol content, country or region. The `drinkingWindowTo` and the Flaschengrösse SHALL NOT be considered.

#### Scenario: Bare year does not match by drinking window
- **WHEN** the user enters `2025` and a product's only matching attribute would be a `drinkingWindowTo` in 2024
- **THEN** the product does not match the text filter

#### Scenario: Text that only resembles the query
- **WHEN** the user enters `bis 25`, `bis 2025 rot` or `bisher`
- **THEN** the text is treated as plain text search and `drinkingWindowTo` is not considered

#### Scenario: Plain text still matches regular fields
- **WHEN** the user enters `merlot` and a product's grape variety is `Merlot`
- **THEN** the product matches the text filter

#### Scenario: Bare size does not match by bottle size
- **WHEN** the user enters `1500` and a product's only matching attribute would be a Flaschengrösse of 1500
- **THEN** the product does not match the text filter

#### Scenario: Text that only resembles the size query
- **WHEN** the user enters `ml`, `ml 1500 rot`, `1500ml` or `mlx`
- **THEN** the text is treated as plain text search and the Flaschengrösse is not considered
