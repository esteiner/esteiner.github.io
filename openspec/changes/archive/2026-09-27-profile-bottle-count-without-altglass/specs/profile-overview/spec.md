## ADDED Requirements

### Requirement: The bottle total leaves out Altglass
The "Flaschen" row in the profile page's "Kellermeister" section SHALL show the number of bottles whose cellar is not the Altglass cellar. Bottles in the Kellerarbeit cellar and bottles without a cellar SHALL be counted.

#### Scenario: Bottles in regular cellars and Altglass
- **WHEN** there are 120 bottles in regular cellars, 8 in Kellerarbeit and 214 in Altglass
- **THEN** the "Flaschen" row shows `128`

#### Scenario: No bottles in Altglass
- **WHEN** there are 50 bottles and none of them is in Altglass
- **THEN** the "Flaschen" row shows `50`

#### Scenario: No bottles at all
- **WHEN** there are no bottles
- **THEN** the "Flaschen" row shows `0`

#### Scenario: Count is available without a session
- **WHEN** the profile page is opened while logged out, with bottles in the local store
- **THEN** the count is shown from the local data
