# Spec Delta

## MODIFIED Requirements

### Requirement: Rows remain ordered by product name

The cellar view SHALL order the product rows by product name (case-insensitive), so that rows with identical names appear adjacent to one another. This applies to every cellar except Altglass, whose rows are ordered by most recent disposal date (see "Altglass rows are ordered by most recent disposal").

#### Scenario: Alphabetical ordering by name
- **WHEN** the grouped rows of a cellar other than Altglass are displayed
- **THEN** they are ordered case-insensitively by product name

#### Scenario: Identically-named products are adjacent
- **WHEN** two rows in a cellar other than Altglass correspond to different product ids that share the same name
- **THEN** those two rows appear next to each other in the ordering

## ADDED Requirements

### Requirement: Altglass rows are ordered by most recent disposal

In the Altglass cellar view, each row's sort date SHALL be the latest effective disposal date of the bottles it shows. Rows SHALL be ordered by this date, newest first. Rows with equal dates SHALL be ordered case-insensitively by product name. Rows without any date SHALL come after all dated rows, ordered by product name. The ordering SHALL also apply when a text filter is active.

#### Scenario: Most recently drunk on top
- **WHEN** product A's last bottle was moved to Altglass yesterday and product B's last bottle today
- **THEN** the row of B is shown above the row of A

#### Scenario: Row date is the latest bottle
- **WHEN** a row contains one bottle disposed a year ago and one disposed today
- **THEN** the row is sorted by today's date

#### Scenario: Newly disposed bottle moves its row to the top
- **WHEN** the user drinks another bottle of a product whose row is further down in Altglass
- **THEN** after the move that product's row is shown at the top of the Altglass list

#### Scenario: Undated rows at the end
- **WHEN** some rows have no effective disposal date
- **THEN** they appear after all dated rows, ordered alphabetically by product name

#### Scenario: Filter keeps the order
- **WHEN** a text filter is applied in Altglass
- **THEN** the remaining rows keep the newest-first order
