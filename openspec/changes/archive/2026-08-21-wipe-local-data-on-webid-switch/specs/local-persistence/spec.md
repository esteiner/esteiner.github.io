## MODIFIED Requirements

### Requirement: Session metadata persists locally in IndexedDB
The system SHALL persist two singleton session-metadata values in IndexedDB: the WebID used to authenticate, and the date of the last successful synchronization. The WebID SHALL be stored when an authenticated session is established (login or session restore). The last successful sync date SHALL be stored whenever a synchronization run completes successfully. Both values SHALL survive a reload and SHALL be readable offline and before any session is restored. This metadata is local-only device state and SHALL NOT be synced to the Pod. The persisted WebID additionally serves as the marker of which identity the local data belongs to, so a login with a different WebID can be detected; it is therefore rewritten only as part of adopting an identity.

#### Scenario: Last sync date survives a reload
- **WHEN** a synchronization completes successfully and the user later reloads the app
- **THEN** the persisted last sync date is read back from IndexedDB and shown as the last-sync time (not reset to "no sync yet")

#### Scenario: WebID is stored on login and readable offline
- **WHEN** a user establishes an authenticated session and later reloads or opens the app without a live session
- **THEN** the WebID used is read back from IndexedDB and available for display

#### Scenario: No metadata stored yet
- **WHEN** the app starts and no WebID or sync has ever been recorded
- **THEN** reading the persisted WebID and last sync date yields no value and no error is raised

#### Scenario: Metadata is not synced to the Pod
- **WHEN** a synchronization run reconciles the tracked collections
- **THEN** the locally stored WebID and last sync date are not written to the Pod

#### Scenario: The recorded WebID identifies the owner of the local data
- **WHEN** a session is established and the persisted WebID differs from the WebID of that session
- **THEN** the difference is detectable before the session is used, so the local data of the previous identity can be deleted first
