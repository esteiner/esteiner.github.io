# bottle-disposal-date Specification

## Purpose
Records when a bottle was drunk, i.e. moved to the Altglass cellar, so that the app can show recently drunk wines first and remains usable with older bottles that never stored this date.

## Requirements

### Requirement: Disposing a bottle records its disposal date
When a bottle is moved to the Altglass cellar, the system SHALL store the current date and time on the bottle as its disposal date. This SHALL happen whether or not a rating is given. The disposal date SHALL be persisted with the bottle and synchronised to the Pod.

#### Scenario: Dispose with rating
- **WHEN** the user moves a bottle to Altglass and gives it a rating
- **THEN** the bottle is in Altglass and its disposal date is the time of the move

#### Scenario: Dispose without rating
- **WHEN** the user moves a bottle to Altglass without giving a rating
- **THEN** the bottle is in Altglass and its disposal date is the time of the move

#### Scenario: Disposal date survives a reload
- **WHEN** a bottle has been moved to Altglass and the app is reloaded or the data is synchronised from the Pod on another device
- **THEN** the bottle still has the same disposal date

### Requirement: Bottles without a stored disposal date remain readable
The disposal date SHALL be optional. Bottle resources written before this change, or by older app versions, SHALL load without error and SHALL keep all their other data.

#### Scenario: Legacy bottle loads
- **WHEN** a bottle resource without a disposal date is loaded
- **THEN** the bottle is shown normally and has no stored disposal date

### Requirement: Effective disposal date for bottles in Altglass
For a bottle in Altglass, the system SHALL derive an effective disposal date: the stored disposal date if present; otherwise the date of the bottle's rating if it has one; otherwise the time the bottle was last modified. A bottle for which none of these is known SHALL have no effective disposal date. Deriving it SHALL NOT write anything to the Pod.

#### Scenario: Stored date wins
- **WHEN** a bottle in Altglass has a stored disposal date and a rating with a different date
- **THEN** its effective disposal date is the stored disposal date

#### Scenario: Fallback to the rating date
- **WHEN** a bottle in Altglass has no stored disposal date but has a dated rating
- **THEN** its effective disposal date is the rating date

#### Scenario: Fallback to the last modification
- **WHEN** a bottle in Altglass has neither a stored disposal date nor a dated rating
- **THEN** its effective disposal date is the time the bottle was last modified
