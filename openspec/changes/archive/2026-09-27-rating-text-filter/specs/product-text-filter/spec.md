## ADDED Requirements

### Requirement: Rating query with "top<N>"
The text filter SHALL treat an entered text of the form `top<N>`, with N being 1, 2 or 3, as a rating query. The match SHALL be case-insensitive, SHALL ignore leading and trailing whitespace, SHALL allow zero or more whitespace characters between `top` and N, and SHALL require nothing after N. For such a query, a product SHALL match only if at least one of its ratings (from its bottles or its legacy product ratings) has exactly the value N. Products without ratings SHALL NOT match. The regular text fields SHALL NOT be searched for a rating query.

#### Scenario: Rated 3
- **WHEN** the user enters `top3` and one of a product's ratings is 3
- **THEN** the product matches the text filter

#### Scenario: Only exact values match
- **WHEN** the user enters `top2` and a product's only rating is 3
- **THEN** the product does not match the text filter

#### Scenario: Any of several ratings
- **WHEN** the user enters `top1` and a product has the ratings 3 and 1
- **THEN** the product matches the text filter

#### Scenario: Rating on a bottle already in Altglass
- **WHEN** the user enters `top3` in a cellar, and a product listed there has a bottle in Altglass that was rated 3
- **THEN** the product matches the text filter

#### Scenario: Product without ratings
- **WHEN** the user enters `top3` and a product has no ratings
- **THEN** the product does not match the text filter

#### Scenario: Case and whitespace variants
- **WHEN** the user enters `TOP3`, `top 3` or `  Top   3  `
- **THEN** the text is treated as the rating query for 3

## MODIFIED Requirements

### Requirement: Plain text search ignores the drinking window
For any entered text that is not a drinking-window query, a bottle-size query or a rating query, the text filter SHALL match a product only if the lower-cased text is contained in one of its name, production date, grape variety, alcohol content, country or region. The `drinkingWindowTo`, the Flaschengrösse and the ratings SHALL NOT be considered.

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

#### Scenario: Text that only resembles the rating query
- **WHEN** the user enters `top`, `top0`, `top4`, `top 3 rot` or `topwein`
- **THEN** the text is treated as plain text search and ratings are not considered
