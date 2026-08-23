## ADDED Requirements

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
