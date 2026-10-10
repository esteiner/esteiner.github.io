# cellar-bottle-grouping Specification

## Purpose

Kellermeister's cellar view groups a cellar's bottles into product rows. Grouping is keyed by the **id of a bottle's product** so that two genuinely distinct products which happen to share an identical name are shown as separate rows rather than collapsed together. Each row reflects exactly the product its bottles belong to (name, price, source, ratings), and rows remain ordered by product name so identically-named products stay adjacent.

## Requirements

### Requirement: Bottles are grouped by product id

The cellar view SHALL group a cellar's bottles into rows by the **id of their product**. All bottles that share the same product id SHALL form one group; a group's count SHALL be the number of bottles it contains.

#### Scenario: Bottles of the same product are combined
- **WHEN** a cellar contains several bottles that all reference the same product id
- **THEN** they appear as a single row whose count equals the number of those bottles

#### Scenario: The row reflects its own product
- **WHEN** a group of bottles for one product id is shown
- **THEN** the row's displayed product details (name, price, source, ratings) are those of that product id

### Requirement: Products with identical names but different ids are shown separately

The cellar view SHALL NOT merge bottles of different product ids, even when those products have exactly the same name. Each distinct product id SHALL produce its own row.

#### Scenario: Same name, different ids
- **WHEN** a cellar contains bottles of two products that have identical names but different product ids
- **THEN** two separate rows are shown, one per product id
- **AND** each row's count reflects only the bottles of its own product id

#### Scenario: Same name, same id
- **WHEN** a cellar contains multiple bottles of one product (same id, same name)
- **THEN** a single row is shown for that product

### Requirement: Rows remain ordered by product name

The cellar view SHALL order the product rows by product name (case-insensitive), so that rows with identical names appear adjacent to one another. This applies to every cellar except Altglass, whose rows are ordered by most recent disposal date (see "Altglass rows are ordered by most recent disposal").

#### Scenario: Alphabetical ordering by name
- **WHEN** the grouped rows of a cellar other than Altglass are displayed
- **THEN** they are ordered case-insensitively by product name

#### Scenario: Identically-named products are adjacent
- **WHEN** two rows in a cellar other than Altglass correspond to different product ids that share the same name
- **THEN** those two rows appear next to each other in the ordering

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
