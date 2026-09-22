## ADDED Requirements

### Requirement: Profile page sections are ordered with Kellermeister first

The profile page SHALL present its sections in this order, top to bottom: **"Kellermeister"**, **"Solid Profil"**, **"Solid Apps"**, **"Debug"**. The "Kellermeister" section — which holds the app version, the bottle total, and the "Keller" group with its add and delete actions — SHALL be the first section, so the page opens on the user's own cellar data rather than on Solid account details.

#### Scenario: Kellermeister is the first section
- **WHEN** the profile page is opened
- **THEN** the first section shown is "Kellermeister"
- **AND** it appears above the "Solid Profil" section

#### Scenario: The remaining sections keep their relative order
- **WHEN** the profile page is opened
- **THEN** the sections read, in order: "Kellermeister", "Solid Profil", "Solid Apps", "Debug"

#### Scenario: Section contents are unaffected by the ordering
- **WHEN** the profile page is opened
- **THEN** each section shows exactly the rows it did before, with its actions working as specified elsewhere in this capability

### Requirement: The profile page is labelled "Kellerprofil"

The profile page SHALL be titled **"Kellerprofil"**, and the footer action that navigates to it SHALL carry the same label. The name distinguishes the user's Kellermeister profile from the "Solid Profil" section shown within the page, which keeps its own name.

#### Scenario: The page title
- **WHEN** the profile page is opened
- **THEN** its header reads "Kellerprofil"

#### Scenario: The footer action
- **WHEN** any page showing the app footer is displayed
- **THEN** the footer action leading to the profile page is labelled "Kellerprofil"
- **AND** activating it opens the profile page

#### Scenario: The Solid section keeps its own name
- **WHEN** the profile page is opened
- **THEN** the section listing the Solid account details is still headed "Solid Profil"
