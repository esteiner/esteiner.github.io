# well-known-cellars Specification

## Purpose

Kellermeister provides two well-known cellars — `cellarwork` (display name "Eingang") and `altglass` (display name "Altglass") — that exist for every user with stable, fixed identities. Because the app is local-first, these cellars must be created automatically and be usable before any Solid login, re-verified during Pod container resolution, and ensured idempotently so that they never duplicate or overwrite user changes across devices, sessions, and restarts.

## Requirements

### Requirement: Fixed identities for well-known cellars

The system SHALL provide exactly two well-known cellars with fixed, stable slugs: `cellarwork` (display name "Eingang") and `altglass` (display name "Altglass"). Their identity slugs MUST NOT be randomly generated; they MUST be the literal strings `cellarwork` and `altglass`, so that the same well-known cellar resolves to the same identity on every device and across sessions.

#### Scenario: Well-known cellars use fixed slugs
- **WHEN** the system determines the id of the cellarwork or altglass cellar
- **THEN** the slug portion of the id is exactly `cellarwork` or `altglass` respectively (not a random uuid)
- **AND** the two ids are distinct from each other and from any ordinary cellar's id

#### Scenario: Fixed slug re-homes to a stable Pod URL
- **WHEN** a well-known cellar created before login is re-homed to the Pod during sync
- **THEN** its Pod URL is derived from its fixed slug (e.g. `<podBase>cellars/cellarwork#it`)
- **AND** re-running the re-home computes the identical Pod URL, producing no duplicate

### Requirement: Well-known cellars are created automatically at startup

The system SHALL ensure that both well-known cellars exist in the local store when the cellar repository initializes, before any Solid login. Because the app is local-first, these cellars MUST be usable and MUST appear in the cellar listing without requiring a login or a prior lookup of that specific cellar.

#### Scenario: Cellars present before login
- **WHEN** the app starts and the local cellar repository initializes on a fresh (empty) local store
- **THEN** both the cellarwork and altglass cellars exist locally
- **AND** listing all cellars returns both of them even though no user has logged in and neither was fetched by id

### Requirement: Well-known cellars are re-verified during container resolution

The system SHALL re-verify the existence of both well-known cellars during Pod container resolution: after the Kellermeister Pod subfolders are provisioned in `resolveKellermeisterContainer`, any missing well-known cellar MUST be created. This acts as a safety net for local stores that predate automatic startup creation.

#### Scenario: Missing well-known cellar restored at container resolution
- **WHEN** `resolveKellermeisterContainer` runs after login and provisions the Pod subfolders
- **AND** one or both well-known cellars are absent from the local store
- **THEN** the absent well-known cellar(s) are created before container resolution completes

#### Scenario: Existing well-known cellars are left untouched at container resolution
- **WHEN** `resolveKellermeisterContainer` runs after login
- **AND** both well-known cellars already exist
- **THEN** container resolution completes without creating, duplicating, or overwriting either cellar

### Requirement: Idempotent ensure semantics

Creation of the well-known cellars SHALL be idempotent. Ensuring a well-known cellar when it already exists MUST NOT create a duplicate and MUST NOT overwrite its current data (including a user-renamed display name). Ensuring it when it is absent MUST create it with its fixed slug and default display name.

#### Scenario: Ensure is a no-op when the cellar already exists
- **WHEN** the ensure operation runs for a well-known cellar that already exists locally
- **THEN** the existing cellar is returned unchanged
- **AND** no second cellar with the same slug is created

#### Scenario: Repeated ensure never duplicates
- **WHEN** the ensure operation runs multiple times (e.g. startup, then again at container resolution, then after a restart)
- **THEN** at most one cellar exists for each well-known slug at all times
