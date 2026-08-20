## MODIFIED Requirements

### Requirement: Profile page can delete an empty cellar
The profile page SHALL provide, behind each listed cellar name, a delete action. When the cellar contains no bottles, activating the action SHALL first ask the user to confirm the deletion; the cellar SHALL be deleted and the list refreshed only if the user confirms, and if the user cancels the cellar SHALL NOT be deleted and the list SHALL remain unchanged. When the cellar still contains bottles, the action SHALL NOT delete it and SHALL instead show an informational dialog explaining that a cellar containing bottles cannot be deleted; from that dialog the user MAY navigate to the cellar's page (to empty it) or dismiss the dialog.

#### Scenario: Confirming deletion of an empty cellar
- **WHEN** the user activates the delete action for a cellar that contains no bottles and confirms the prompt
- **THEN** the cellar is deleted
- **AND** the "Keller" list refreshes so the cellar no longer appears

#### Scenario: Cancelling deletion of an empty cellar
- **WHEN** the user activates the delete action for a cellar that contains no bottles but cancels the confirmation prompt
- **THEN** the cellar is NOT deleted
- **AND** the "Keller" list remains unchanged

#### Scenario: Delete action on a non-empty cellar shows an informational dialog
- **WHEN** the user activates the delete action for a cellar that still contains one or more bottles
- **THEN** an informational dialog is shown stating that a cellar containing bottles cannot be deleted
- **AND** the cellar is NOT deleted

#### Scenario: Navigating to the cellar from the informational dialog
- **WHEN** the informational dialog for a non-empty cellar is shown and the user chooses to go to the cellar
- **THEN** the app navigates to that cellar's page

#### Scenario: Dismissing the informational dialog
- **WHEN** the informational dialog for a non-empty cellar is shown and the user dismisses it
- **THEN** the dialog closes, the cellar is NOT deleted, and the app stays on the profile page
