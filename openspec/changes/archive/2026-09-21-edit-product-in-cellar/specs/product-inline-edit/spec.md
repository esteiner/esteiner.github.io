## ADDED Requirements

### Requirement: An expanded product row offers an edit affordance

When a product row in the cellar bottle view is expanded, the system SHALL show a pencil button in the row header, aligned to the right. The button SHALL NOT be shown while the row is collapsed.

#### Scenario: Pencil appears on expand
- **WHEN** the user clicks a product row header to expand it
- **THEN** the product detail fields are shown as read-only labels
- **AND** a pencil button appears in the header, aligned to the right

#### Scenario: Pencil hidden when collapsed
- **WHEN** a product row is collapsed
- **THEN** no pencil button is shown for that row

### Requirement: The pencil toggles edit mode

Clicking the pencil button SHALL toggle the row's detail fields between read-only labels and editable input fields. Clicking the pencil SHALL NOT collapse the row.

#### Scenario: Enter edit mode
- **WHEN** the user clicks the pencil button on an expanded row
- **THEN** the editable detail fields change from labels to input fields
- **AND** the row stays expanded

#### Scenario: Leave edit mode
- **WHEN** the user clicks the pencil button again while in edit mode
- **THEN** the input fields change back to read-only labels
- **AND** the row stays expanded

### Requirement: Editing a field writes through to the product and persists

While in edit mode, changing an editable input SHALL write the new value to the product model immediately, and the change SHALL be persisted so it survives collapsing the row, leaving the page, and synchronization.

#### Scenario: A change is written and persisted
- **WHEN** the user edits an editable field (for example, Region) in edit mode
- **THEN** the product model's corresponding attribute is updated with the new value
- **AND** the value is persisted

#### Scenario: Persisted edit survives a reload
- **WHEN** a user edits a product field, then collapses the row and re-expands it (or reloads the cellar view)
- **THEN** the edited value is shown

### Requirement: Only the product's own attributes are editable

The editable fields SHALL be the product's own attributes: Hersteller, Weinname, Jahrgang, Flaschengrösse, Weinart, Weinfarbe, Region, Land, Traubensorte, Klassifikation, Alkohol, Ausbau, Biologisch, Trinkfenster (from/to), and Preis. Hersteller and Weinname SHALL be shown in the expanded view directly below Preis. Derived or aggregated fields — Quelle (the order's seller/date) and Bewertungen (ratings) — SHALL remain read-only in edit mode.

#### Scenario: Derived fields stay read-only
- **WHEN** the row is in edit mode
- **THEN** Quelle and Bewertungen remain read-only labels (no input field)

#### Scenario: Product attributes are editable
- **WHEN** the row is in edit mode
- **THEN** each of the product's own listed attributes is shown as an input field bound to that attribute

#### Scenario: Hersteller and Weinname are shown below the price
- **WHEN** a product row is expanded
- **THEN** Hersteller and Weinname are shown as detail fields directly below Preis / Flasche

### Requirement: The product name is derived from Hersteller, Weinname and Jahrgang

When the user edits Hersteller, Weinname, or Jahrgang, the system SHALL recompute the product's `name` as the space-separated concatenation of Hersteller, Weinname, and the Jahrgang year, omitting parts that are empty. The recomputed name SHALL be reflected in the row header.

#### Scenario: Name recomputed on edit
- **WHEN** the user edits Hersteller, Weinname, or Jahrgang in edit mode
- **THEN** the product's name becomes "<Hersteller> <Weinname> <year>" (empty parts omitted)
- **AND** the row header shows the recomputed name

#### Scenario: Missing parts are omitted
- **WHEN** the name is recomputed and one of Hersteller, Weinname, or Jahrgang is empty
- **THEN** that part is omitted and no extra separators remain

### Requirement: Collapsing leaves edit mode

Clicking the row header while it is expanded SHALL collapse the row. A collapsed-then-re-expanded row SHALL start in read-only (non-edit) mode.

#### Scenario: Header click collapses and exits edit mode
- **WHEN** the user clicks the header of an expanded row (whether or not it is in edit mode)
- **THEN** the row collapses
- **AND** re-expanding it shows read-only labels (not inputs) until the pencil is clicked again

### Requirement: Inline editing is limited to the cellar view

Inline product editing SHALL be available in the cellar bottle view. The product detail display used elsewhere (for example, the order view's product display) SHALL remain read-only.

#### Scenario: Order view stays read-only
- **WHEN** a product's details are shown in the order view
- **THEN** no pencil button is shown and the fields cannot be edited
