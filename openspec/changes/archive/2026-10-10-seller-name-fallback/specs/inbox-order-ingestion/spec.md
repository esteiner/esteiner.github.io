# Spec Delta

## ADDED Requirements

### Requirement: Order item price details are carried over on ingestion

When an inbox order is ingested, each persisted order item SHALL carry over its source item's order quantity, price, price currency, and **price source**. This ensures the price source is stored locally and is available wherever the order item is displayed.

#### Scenario: Price source is persisted with the order item
- **WHEN** an inbox order whose order item has a price source is ingested
- **THEN** the persisted order item exposes the same price source after it is read back

#### Scenario: Missing price source is tolerated
- **WHEN** an inbox order item has no price source
- **THEN** the order item is persisted without a price source and no error is raised
