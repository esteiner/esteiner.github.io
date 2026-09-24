## ADDED Requirements

### Requirement: Drinking-window query with "bis <year>"
The text filter SHALL treat an entered text of the form `bis <year>` as a drinking-window query. The match SHALL be case-insensitive, SHALL ignore leading and trailing whitespace, SHALL allow zero or more whitespace characters between `bis` and the year, and SHALL require the year to be exactly four digits with nothing after it. For such a query, a product SHALL match only if it has a `drinkingWindowTo` whose year is less than or equal to the entered year. Products without a `drinkingWindowTo` SHALL NOT match. The regular text fields SHALL NOT be searched for a drinking-window query.

#### Scenario: Drinking window ends before the entered year
- **WHEN** the user enters `bis 2025` and a product has `drinkingWindowTo` in 2024
- **THEN** the product matches the text filter

#### Scenario: Drinking window ends in the entered year
- **WHEN** the user enters `bis 2025` and a product has `drinkingWindowTo` in 2025
- **THEN** the product matches the text filter

#### Scenario: Drinking window ends after the entered year
- **WHEN** the user enters `bis 2025` and a product has `drinkingWindowTo` in 2026
- **THEN** the product does not match the text filter

#### Scenario: Product without drinking window
- **WHEN** the user enters `bis 2025` and a product has no `drinkingWindowTo`
- **THEN** the product does not match the text filter

#### Scenario: Case and whitespace variants
- **WHEN** the user enters `Bis 2025`, `BIS2025` or `  bis   2025  `
- **THEN** the text is treated as the drinking-window query for year 2025

#### Scenario: Other text fields are not searched
- **WHEN** the user enters `bis 2025` and a product's name contains `bis 2025` but its `drinkingWindowTo` is in 2030
- **THEN** the product does not match the text filter

### Requirement: Plain text search ignores the drinking window
For any entered text that is not a drinking-window query, the text filter SHALL match a product only if the lower-cased text is contained in one of its name, production date, grape variety, alcohol content, country or region. The `drinkingWindowTo` SHALL NOT be considered.

#### Scenario: Bare year does not match by drinking window
- **WHEN** the user enters `2025` and a product's only matching attribute would be a `drinkingWindowTo` in 2024
- **THEN** the product does not match the text filter

#### Scenario: Text that only resembles the query
- **WHEN** the user enters `bis 25`, `bis 2025 rot` or `bisher`
- **THEN** the text is treated as plain text search and `drinkingWindowTo` is not considered

#### Scenario: Plain text still matches regular fields
- **WHEN** the user enters `merlot` and a product's grape variety is `Merlot`
- **THEN** the product matches the text filter
