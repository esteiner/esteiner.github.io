# Profile Overview

## Purpose

The profile page gives the user an overview of their Kellermeister data. It presents the user's cellars in a "Keller" group, allowing the user to see the cellars they own, add a new cellar, and delete an empty cellar (or navigate to a non-empty cellar's page to empty it first). This overview is available local-first, so it works even without an authenticated Solid session.

## Requirements

### Requirement: Profile page lists existing cellars
The profile page SHALL display the names of the user's cellars in its "Keller" group. The list SHALL include every existing cellar EXCEPT those with a negative `displayOrder` (e.g. the well-known `cellarwork`/`altglass` cellars); a cellar with a zero or absent `displayOrder` SHALL be shown. The list SHALL be available local-first (without requiring an authenticated session).

#### Scenario: Existing cellars are listed
- **WHEN** the profile page is opened and one or more cellars with a non-negative displayOrder exist
- **THEN** the "Keller" group shows the name of each such cellar

#### Scenario: Cellars with a negative displayOrder are hidden
- **WHEN** the profile page is opened and some cellars have a negative displayOrder
- **THEN** those cellars are NOT listed in the "Keller" group
- **AND** cellars with a zero or absent displayOrder are still listed

#### Scenario: No cellars to show
- **WHEN** the profile page is opened and no cellars exist (or the list has not loaded yet)
- **THEN** the "Keller" group shows a neutral placeholder rather than an empty or broken value, and no error is raised

#### Scenario: Cellars are shown while logged out
- **WHEN** the profile page is opened without an authenticated Solid session but cellars exist locally
- **THEN** the "Keller" group still lists those cellars

### Requirement: Profile page can add a new cellar
The profile page SHALL provide an action, positioned on the right side of the "Keller" group, to create a new cellar. Invoking it SHALL prompt for a cellar name and, when a name is provided, create the cellar and refresh the displayed list so the new cellar appears.

#### Scenario: Add a new cellar from the profile page
- **WHEN** the user activates the add-cellar action in the "Keller" group and provides a name
- **THEN** a new cellar with that name is created
- **AND** the "Keller" group's list refreshes to include the new cellar

#### Scenario: Cancelling the add-cellar prompt
- **WHEN** the user activates the add-cellar action but cancels or provides no name
- **THEN** no cellar is created and the list is unchanged

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
