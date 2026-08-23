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

### Requirement: Cellar delete controls are presented consistently
The delete controls in the profile page's "Keller" list SHALL be rendered without a border. They SHALL be positioned close to the cellar names (immediately following the names, not pushed to the far edge of the row) AND SHALL be vertically aligned with one another, sharing a common horizontal position regardless of the individual cellar names' lengths.

#### Scenario: Delete controls are borderless, close to the names, and aligned
- **WHEN** the "Keller" list shows two or more cellars whose names differ in length
- **THEN** each cellar's delete control is rendered without a border
- **AND** the delete controls appear directly after the names (close to the labels, not at the far edge)
- **AND** the delete controls line up along a common vertical line

### Requirement: Profile page can upload a file to the Pod inbox
The profile page SHALL offer, in the "Inbox Upload" row of its "Debug" section, a control that uploads one or more files chosen by the user to the Pod inbox container `{storageRoot}inbox/kellermeister/` using the authenticated Solid session. The upload SHALL be available only while an authenticated session exists AND the Pod container base is resolved — the same precondition as reading unprocessed orders from the inbox — and SHALL state which precondition is unmet when it is unavailable. The upload SHALL NOT replace an existing inbox resource. The file SHALL be uploaded with the content type reported by the browser, falling back to `text/turtle` when the browser reports none, so that an uploaded order is stored as an RDF resource that inbox ingestion can read. The system SHALL NOT validate the contents of the file. When several files are chosen, each SHALL be uploaded and SHALL be reported individually: a failure for one file SHALL NOT prevent the remaining files from being uploaded, nor suppress the results of those that succeeded.

#### Scenario: A chosen file is uploaded to the inbox
- **WHEN** the user picks a file while logged in with a resolved Pod container base
- **THEN** the file is written into `{storageRoot}inbox/kellermeister/` using the authenticated session
- **AND** no resource already present in the inbox is replaced

#### Scenario: A Turtle file with no browser-reported type is stored as RDF
- **WHEN** the chosen file is uploaded and the browser reports no content type for it (as is usual for `.ttl`)
- **THEN** it is uploaded as `text/turtle`
- **AND** it is therefore readable by inbox order ingestion rather than stored as an opaque file

#### Scenario: A file whose type the browser knows keeps that type
- **WHEN** the chosen file is uploaded and the browser reports a content type for it
- **THEN** it is uploaded with that content type

#### Scenario: The created resource is reported back
- **WHEN** an upload succeeds
- **THEN** the URL of the resource that was created is shown in the row
- **AND** the URL is shown because the server assigns the name, so it cannot be derived from the chosen file name

#### Scenario: Several chosen files are all uploaded
- **WHEN** the user picks more than one file
- **THEN** every chosen file is uploaded into the inbox
- **AND** each one is reported separately with its own created URL

#### Scenario: One failure among several does not stop or hide the others
- **WHEN** several files are uploaded and one of them fails
- **THEN** the remaining files are still uploaded
- **AND** the failing file is reported as failed while the successful ones are still reported with their URLs

#### Scenario: A failed upload says why
- **WHEN** an upload fails (for example the server rejects it or the network drops)
- **THEN** the failure is reported in the row
- **AND** no success is indicated

#### Scenario: Upload is unavailable without a session or a resolved container
- **WHEN** the profile page is shown without an authenticated session, or before the Pod container base is resolved
- **THEN** the upload control is unavailable
- **AND** the reason it is unavailable is stated

#### Scenario: The contents of the file are not checked
- **WHEN** the chosen file is not a well-formed order
- **THEN** it is uploaded unchanged and the upload is reported as successful
- **AND** the problem surfaces where orders are ingested, not at upload time
