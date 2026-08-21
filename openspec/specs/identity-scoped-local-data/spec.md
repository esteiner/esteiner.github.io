# identity-scoped-local-data Specification

## Purpose

Local data is the source of truth in Kellermeister and is re-homed to whichever Pod the user is logged into, so the local store must belong to exactly one identity. This capability ties the store to the WebID last used on the device: a login with a different WebID deletes the previous identity's local data first, after warning the user and obtaining confirmation, so that one identity's data is never shown to — nor synchronized into the Pod of — another. A first login on a device is not a switch: data created offline before authenticating belongs to that same user and survives.

## Requirements

### Requirement: Local data belongs to the WebID last used on the device
The system SHALL treat the locally stored data as belonging to the WebID last used to authenticate on this device, recorded as the persisted WebID. When a session is established for a WebID that differs from the recorded one, the system SHALL delete that local data before the new session is used — that is, before the Pod container base is resolved and before any synchronization run. Local data of a previous identity SHALL NOT be readable by a session for a different WebID, and SHALL NOT be synchronized into a different WebID's Pod. If the deletion cannot be carried out, the system SHALL NOT adopt the session and SHALL inform the user why, rather than proceeding with the previous identity's data in place.

#### Scenario: Logging in with a different WebID deletes the previous identity's data
- **WHEN** a session is established for a WebID that differs from the recorded one and the user confirms the deletion
- **THEN** the local data of the previous identity is deleted before the new session is used
- **AND** no cellar, bottle, product, or order of the previous identity is readable by the new session
- **AND** nothing belonging to the previous identity is synchronized into the new WebID's Pod

#### Scenario: The session is not adopted when the deletion cannot be carried out
- **WHEN** a session is established for a different WebID, the user confirms, but the local data cannot be deleted (for example because another tab of the application holds the local database open)
- **THEN** the session is not adopted
- **AND** the user is informed that the data could not be deleted and what to do about it
- **AND** the previous identity's data remains intact, so the switch can be retried

#### Scenario: Logging in with the same WebID changes nothing
- **WHEN** a session is established for the same WebID as the recorded one
- **THEN** no local data is deleted
- **AND** no warning is shown

#### Scenario: First login on a device keeps the data created before it
- **WHEN** a session is established and no WebID has been recorded on this device yet
- **THEN** no local data is deleted and no warning is shown
- **AND** data created offline before logging in remains available, so it can be synchronized to the Pod

### Requirement: The user is warned before local data is deleted
The system SHALL inform the user before deleting any local data on a WebID switch, and SHALL delete nothing until the user confirms. The warning SHALL state that the locally stored data will be deleted and that data not yet synchronized to the previous WebID's Pod cannot be recovered afterwards. Where the WebID intended for a login is known before the login flow starts, the system SHALL warn at that point, so the user is warned before leaving the application. The system SHALL NOT ask for confirmation more than once for the same confirmed switch.

#### Scenario: Warning precedes the login flow when the WebID is known in advance
- **WHEN** the user selects a WebID for login that differs from the recorded one
- **THEN** the user is warned that local data will be deleted and that unsynchronized data is lost, before the login flow navigates away from the application

#### Scenario: Cancelling before login leaves everything untouched
- **WHEN** the user is warned before the login flow starts and cancels
- **THEN** no login is started and no local data is deleted
- **AND** the previously recorded WebID and its data remain unchanged

#### Scenario: Cancelling after a session was established does not adopt the session
- **WHEN** a session has been established for a different WebID and the user cancels the deletion
- **THEN** no local data is deleted
- **AND** the session is not adopted: the system logs out and the previous identity's data remains available

#### Scenario: A confirmed switch is not confirmed twice
- **WHEN** the user has confirmed the deletion before the login flow started and the session is then established for that WebID
- **THEN** the deletion is carried out without asking again

### Requirement: Scope of the local deletion
The deletion SHALL cover the locally stored domain data (cellars, bottles, products, orders), the locally stored session metadata (the recorded WebID, the last synchronization date, and any remembered synchronization request), and the persisted Pod container base, including any copy of that base held in memory. The deletion SHALL NOT remove the list of WebIDs offered for login, which is device-level convenience state rather than data belonging to an identity. The deletion SHALL be idempotent, so re-running it on already-absent state succeeds without error.

#### Scenario: Identity-scoped state is gone after the switch
- **WHEN** the deletion has been carried out for a WebID switch
- **THEN** no domain data of the previous identity remains
- **AND** the last synchronization date and any remembered synchronization request are gone
- **AND** the Pod container base is treated as unresolved, so the new session resolves it afresh rather than reusing the previous identity's container

#### Scenario: The login WebID list survives the switch
- **WHEN** the deletion has been carried out
- **THEN** the list of WebIDs offered for login still contains the entries the user had typed, including the previous WebID

#### Scenario: Deleting already-absent state succeeds
- **WHEN** the deletion runs against state that is already absent or was only partly written
- **THEN** it completes without error

### Requirement: The application starts clean after a switch
After the deletion, the system SHALL present the state of a fresh installation authenticated as the new WebID: no data of the previous identity is shown, the recorded WebID is the new one, and the well-known cellars exist as they do on a fresh start. Cached read models and bootstrap state from before the deletion SHALL NOT be served afterwards.

#### Scenario: No stale data is shown after the switch
- **WHEN** the deletion has been carried out and the application is usable again
- **THEN** the cellar, bottle, product, and order views show no data of the previous identity
- **AND** the well-known cellars are present as on a fresh start

#### Scenario: The new WebID becomes the recorded identity
- **WHEN** the deletion has been carried out for a switch to a new WebID
- **THEN** the recorded WebID is the new one
- **AND** a subsequent start with that same WebID neither warns nor deletes anything

#### Scenario: An interrupted switch does not adopt the previous identity's data
- **WHEN** the deletion completes but recording the new WebID does not
- **THEN** the next login is treated as a first login on the device
- **AND** no data of the previous identity is presented as belonging to the new WebID
