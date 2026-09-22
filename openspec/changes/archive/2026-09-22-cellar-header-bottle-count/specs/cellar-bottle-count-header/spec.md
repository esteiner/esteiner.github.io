## ADDED Requirements

### Requirement: The cellar header shows the cellar's total bottle count

The cellar view's header SHALL display, directly below the cellar name, the total number of bottles currently held in that cellar, followed by the German unit word — `Flaschen` for any count other than one, `Flasche` for a count of exactly one.

#### Scenario: A cellar with several bottles
- **WHEN** the cellar view is shown for a cellar holding 83 bottles
- **THEN** the header shows the cellar name
- **AND** below it the text `83 Flaschen`

#### Scenario: A cellar with exactly one bottle
- **WHEN** the cellar view is shown for a cellar holding exactly one bottle
- **THEN** the header subline reads `1 Flasche`

#### Scenario: An empty cellar
- **WHEN** the cellar view is shown for a cellar holding no bottles
- **THEN** the header subline reads `0 Flaschen`

### Requirement: The count is the cellar total, independent of active filters

The displayed count SHALL be the number of **all** bottles in the cellar. It SHALL NOT be reduced by the active wine-type filters (Sprudel, Rot, Weiss, Rosé) or by the text search filter, which restrict only the product rows listed below the header.

#### Scenario: A wine-type filter is active
- **WHEN** a cellar holds 83 bottles of which 12 are red
- **AND** the user activates the `Rot` filter
- **THEN** the product rows show only the red wines
- **AND** the header subline still reads `83 Flaschen`

#### Scenario: A text search is active
- **WHEN** the user enters a search text that matches only some products of the cellar
- **THEN** the header subline still shows the cellar's total bottle count

### Requirement: The count reflects the current contents of the cellar

The displayed count SHALL be recomputed whenever the cellar's bottles change while the cellar view is open, so that it never contradicts the list below it.

#### Scenario: A bottle is disposed to Altglass
- **WHEN** the user disposes a bottle of the displayed cellar to Altglass
- **THEN** the header subline shows a count one lower than before

#### Scenario: Bottles are added to the open cellar
- **WHEN** bottles are added to the cellar currently shown — for example by inbox ingestion or the footer photo-add flow — and the cellar-updated notification is raised
- **THEN** the header subline shows the increased count

#### Scenario: Another cellar is opened
- **WHEN** the user navigates from one cellar view to another cellar
- **THEN** the header subline shows the newly opened cellar's own total count

### Requirement: The subline matches the header typography at a smaller size

The count subline SHALL use the same font family, font style, and color as the existing header title, at a smaller font size — **16px** against the title's 24px — so that it reads as a subordinate line of the same header rather than as a separate UI element.

#### Scenario: Subline styling
- **WHEN** the header with the count subline is rendered
- **THEN** the subline uses the header title's font family, italic style, and primary color
- **AND** its font size is 16px, smaller than the title's 24px

### Requirement: Views without a count render the header unchanged

The header component SHALL treat the count subline as optional. Views that supply no subline — the landing, order, search, profile, and cellarwork-work views — SHALL render their header exactly as before, with no reserved empty space.

#### Scenario: A header without a subline
- **WHEN** a view renders the header without supplying a subline
- **THEN** only the title and the action buttons are shown, with the header's previous layout and height
