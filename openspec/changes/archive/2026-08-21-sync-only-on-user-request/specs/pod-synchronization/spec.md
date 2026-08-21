## ADDED Requirements

### Requirement: Synchronization runs only on an explicit user request
The system SHALL start a synchronization run only when the user invokes the manual sync action, or as the deferred completion of such an invocation. Restoring a session, reloading the application, and regaining network connectivity SHALL NOT start a synchronization run by themselves.

#### Scenario: Reloading the application does not synchronize
- **WHEN** the user reloads the application and an existing Solid session is restored
- **THEN** no synchronization run is started
- **AND** the application remains fully usable from local storage

#### Scenario: Regaining connectivity without a requested sync does not synchronize
- **WHEN** the device transitions from offline to online with a valid session and no outstanding sync request
- **THEN** no synchronization run is started

### Requirement: A requested sync that cannot run yet is remembered
The system SHALL record, in device-local storage that survives a page unload, that the user requested a synchronization which has not been carried out — either because there was no session (the manual action starts the login flow, which navigates away from the application) or because the run failed. A remembered request SHALL be kept while it cannot be served, namely while there is no valid session or the Pod container base is not resolved. Once it can be served, the system SHALL clear the record before starting the run, so that a run which keeps failing is not replayed on every application start. A remembered request SHALL result in at most one synchronization run.

#### Scenario: Sync pressed while logged out is completed after login
- **WHEN** a logged-out user invokes the manual sync action, completes the login flow, and returns to the application
- **THEN** the remembered request is carried out as one synchronization run
- **AND** the request is no longer remembered afterwards, so a later reload does not synchronize again

#### Scenario: Sync pressed while offline is completed on reconnect
- **WHEN** the user invokes the manual sync action while offline and the run fails
- **AND** the device later transitions from offline to online with a valid session
- **THEN** the remembered request is carried out as one synchronization run

#### Scenario: The request is kept while it cannot be served
- **WHEN** a request is remembered and the application starts without a valid session, or with a session but without a resolved Pod container base
- **THEN** no synchronization run is started
- **AND** the request stays remembered, so it is carried out once a session and a resolved container base exist

#### Scenario: An abandoned login leaves the request outstanding
- **WHEN** a logged-out user invokes the manual sync action and does not complete the login flow
- **THEN** no synchronization run is started
- **AND** the request is carried out at the next application start that has a valid session

## MODIFIED Requirements

### Requirement: Manual synchronization
The system SHALL provide a manual action that triggers synchronization between local storage and the Solid Pod. When the manual action is invoked without a valid Solid session, the system SHALL initiate the login flow so the user can authenticate, rather than only surfacing a passive not-authenticated message, and SHALL remember the request so it is carried out after authentication. When an invoked run fails, the system SHALL remember the request so it can be completed later; a request that was coalesced into an already-running sync SHALL NOT be remembered, because that run reports its own outcome.

#### Scenario: Manual sync when online and authenticated
- **WHEN** the user invokes the manual sync action while online with a valid Solid session
- **THEN** the system pulls, merges, and pushes all tracked collections and updates the sync status to reflect completion
- **AND** no request is left remembered

#### Scenario: Manual sync without a session triggers login
- **WHEN** the user invokes the manual sync action with no valid session
- **THEN** the system does not sync
- **AND** the system initiates the login flow (prompting the user for their WebID and starting the OIDC login) instead of showing only a not-authenticated hint
- **AND** the request is remembered before the login flow navigates away from the application

#### Scenario: Manual sync failure that is not an authentication problem
- **WHEN** the user invokes the manual sync action with a valid session and the run fails for a reason other than a missing session (for example, the network drops)
- **THEN** the login flow is NOT initiated
- **AND** the system surfaces a synchronization-failure indication to the user
- **AND** the request is remembered so that regaining connectivity completes it

### Requirement: On-reconnect synchronization
When network connectivity is restored, the system SHALL carry out a remembered synchronization request, provided a valid Solid session and a resolved Pod container base exist. Restored connectivity alone SHALL NOT trigger a synchronization run.

#### Scenario: Connectivity restored with a remembered request
- **WHEN** the device transitions from offline to online, a valid session exists, and a synchronization request is remembered
- **THEN** the system carries out one synchronization run

#### Scenario: Connectivity restored without a remembered request
- **WHEN** the device transitions from offline to online with a valid session and nothing is remembered
- **THEN** the system does not synchronize

#### Scenario: Connectivity restored without a session
- **WHEN** the device transitions from offline to online but no valid session exists
- **THEN** the system skips synchronization silently without prompting for login
- **AND** any remembered request stays remembered

### Requirement: Post-login synchronization
After a session is established, the system SHALL carry out a remembered synchronization request rather than gating application usability on session establishment. A session being established or restored SHALL NOT by itself trigger a synchronization run. Because a first login learns the Pod container base only after the session exists, both the application start and the completion of container resolution SHALL attempt to carry out the remembered request, and the request SHALL result in exactly one run regardless of which attempt is first.

#### Scenario: Login started by pressing Sync completes the requested sync
- **WHEN** a logged-out user presses the manual Sync button, is taken through the login flow, and returns with a restored session
- **THEN** the system carries out one synchronization run without requiring the user to press Sync again

#### Scenario: First login after offline use completes the requested sync
- **WHEN** a user who created data offline invokes the manual sync action, logs in successfully, and the Pod container base is resolved for the first time
- **THEN** the system carries out one synchronization run that re-homes and pushes the offline data

#### Scenario: A restored session without a request does not synchronize
- **WHEN** an existing session is restored on application start and no synchronization request is remembered
- **THEN** the Pod container base is resolved
- **AND** no synchronization run is started
