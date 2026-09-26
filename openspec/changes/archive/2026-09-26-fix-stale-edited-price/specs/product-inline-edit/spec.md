## MODIFIED Requirements

### Requirement: Editing a field writes through to the product and persists

While in edit mode, changing an editable input SHALL write the new value to the product model immediately, and the change SHALL be persisted so it survives collapsing the row, leaving the page, and synchronization. The read-only display of every edited field, including the price, SHALL show the product model's current value as soon as edit mode is left, without requiring a reload or a second edit.

#### Scenario: A change is written and persisted
- **WHEN** the user edits an editable field (for example, Region) in edit mode
- **THEN** the product model's corresponding attribute is updated with the new value
- **AND** the value is persisted

#### Scenario: Persisted edit survives a reload
- **WHEN** a user edits a product field, then collapses the row and re-expands it (or reloads the cellar view)
- **THEN** the edited value is shown

#### Scenario: Edited price is shown after leaving edit mode
- **WHEN** the user changes "Preis / Flasche" from 25 to 32 in edit mode and then presses the pencil to leave edit mode
- **THEN** the read-only price shows 32 with its currency

#### Scenario: Edited price is shown after collapsing and re-expanding
- **WHEN** the user changes the price, collapses the row and expands it again
- **THEN** the read-only price shows the new value
