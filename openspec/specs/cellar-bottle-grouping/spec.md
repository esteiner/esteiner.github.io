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

The cellar view SHALL order the product rows by product name (case-insensitive), so that rows with identical names appear adjacent to one another.

#### Scenario: Alphabetical ordering by name
- **WHEN** the grouped rows are displayed
- **THEN** they are ordered case-insensitively by product name

#### Scenario: Identically-named products are adjacent
- **WHEN** two rows correspond to different product ids that share the same name
- **THEN** those two rows appear next to each other in the ordering
