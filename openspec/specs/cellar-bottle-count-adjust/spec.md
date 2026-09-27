# cellar-bottle-count-adjust Specification

## Purpose
Defines the cellar page's rating dialog layout and how the user adds bottles of an existing product to a cellar from it.
## Requirements
### Requirement: The rating dialog is titled with the product name
The dialog opened by clicking a row's bottle count on the cellar page SHALL show the product name as its title, and "Bewertung" as its subtitle below the title. The rating buttons (0–3) and the actions "Abbrechen" and "Altglass" SHALL behave as before.

#### Scenario: Title and subtitle
- **WHEN** the user clicks the bottle count of the row "Agrapart 7 Crus"
- **THEN** the dialog title is "Agrapart 7 Crus" and the subtitle below it is "Bewertung"

### Requirement: The rating dialog offers adding bottles
The rating dialog SHALL show a "+" button in its upper right corner. Activating it SHALL close the rating dialog and open the bottle-count dialog for the same product and cellar. The button SHALL have an accessible name.

#### Scenario: Open the bottle-count dialog
- **WHEN** the rating dialog for "Agrapart 7 Crus" is open and the user activates "+"
- **THEN** the bottle-count dialog for "Agrapart 7 Crus" is shown, and the rating dialog is no longer shown

### Requirement: The bottle-count dialog shows the current count
The bottle-count dialog SHALL show the product name as its title, a row labelled "Anzahl Flaschen" with a numeric input prefilled with the number of bottles of that product in the current cellar, and the actions "Abbrechen" and "Aktualisieren".

#### Scenario: Prefilled count
- **WHEN** the cellar row "Agrapart 7 Crus" shows 3 bottles and the user opens the bottle-count dialog
- **THEN** the "Anzahl Flaschen" input shows 3

### Requirement: "Aktualisieren" adds bottles to the cellar
When the user enters a number greater than the current count and activates "Aktualisieren", the system SHALL create and persist exactly the difference as new bottle entries of the same product in the current cellar. Afterwards the dialog SHALL close, and the row's bottle count and the cellar header count SHALL reflect the new total. The new bottles SHALL be persisted like any other bottle, so that they survive a reload and are synchronized to the Pod.

#### Scenario: Increase from 3 to 5
- **WHEN** the row shows 3 bottles and the user enters 5 and activates "Aktualisieren"
- **THEN** 2 new bottles of that product are stored in the current cellar
- **AND** the row shows 5 and the header count increases by 2

#### Scenario: Added bottles survive a reload
- **WHEN** bottles have been added and the cellar page is reloaded
- **THEN** the row still shows the increased count

### Requirement: The count cannot be lowered
The bottle-count dialog SHALL NOT remove bottles. "Aktualisieren" SHALL be disabled while the entered number is not a whole number, or is less than or equal to the current count.

#### Scenario: Same value
- **WHEN** the input still shows the current count
- **THEN** "Aktualisieren" is disabled

#### Scenario: Lower value
- **WHEN** the row shows 3 bottles and the user enters 2
- **THEN** "Aktualisieren" is disabled and no bottle is removed

### Requirement: Cancelling leaves the data unchanged
"Abbrechen" in the bottle-count dialog SHALL close it without creating any bottles, and SHALL return directly to the cellar view. The rating dialog SHALL NOT be shown again.

#### Scenario: Cancel
- **WHEN** the user changes the number to 5 and activates "Abbrechen"
- **THEN** no bottle is created, no dialog is shown, and the cellar view shows the unchanged count

