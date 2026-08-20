## MODIFIED Requirements

### Requirement: Manual synchronization
The system SHALL provide a manual action that triggers synchronization between local storage and the Solid Pod. When the manual action is invoked without a valid Solid session, the system SHALL initiate the login flow so the user can authenticate, rather than only surfacing a passive not-authenticated message.

#### Scenario: Manual sync when online and authenticated
- **WHEN** the user invokes the manual sync action while online with a valid Solid session
- **THEN** the system pulls, merges, and pushes all tracked collections and updates the sync status to reflect completion

#### Scenario: Manual sync without a session triggers login
- **WHEN** the user invokes the manual sync action with no valid session
- **THEN** the system does not sync
- **AND** the system initiates the login flow (prompting the user for their WebID and starting the OIDC login) instead of showing only a not-authenticated hint

#### Scenario: Manual sync failure that is not an authentication problem
- **WHEN** the user invokes the manual sync action with a valid session and the run fails for a reason other than a missing session (for example, the network drops)
- **THEN** the login flow is NOT initiated
- **AND** the system surfaces a synchronization-failure indication to the user

### Requirement: Post-login synchronization
After a successful login, the system SHALL trigger a synchronization run rather than gating application usability on session establishment. This applies whether the login was started from a dedicated login action or from the manual sync action initiating login for an unauthenticated user, so that a sync requested before authentication is carried out once the user is authenticated.

#### Scenario: First login after offline use
- **WHEN** a user who created data offline logs in successfully
- **THEN** the system resolves the Pod container base and triggers a sync that re-homes and pushes the offline data

#### Scenario: Login started by pressing Sync completes the requested sync
- **WHEN** a logged-out user presses the manual Sync button, is taken through the login flow, and returns with a restored session
- **THEN** the system triggers a synchronization run without requiring the user to press Sync again
