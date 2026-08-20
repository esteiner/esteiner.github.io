## ADDED Requirements

### Requirement: Cellar delete controls are presented consistently
The delete controls in the profile page's "Keller" list SHALL be rendered without a border. They SHALL be positioned close to the cellar names (immediately following the names, not pushed to the far edge of the row) AND SHALL be vertically aligned with one another, sharing a common horizontal position regardless of the individual cellar names' lengths.

#### Scenario: Delete controls are borderless, close to the names, and aligned
- **WHEN** the "Keller" list shows two or more cellars whose names differ in length
- **THEN** each cellar's delete control is rendered without a border
- **AND** the delete controls appear directly after the names (close to the labels, not at the far edge)
- **AND** the delete controls line up along a common vertical line
