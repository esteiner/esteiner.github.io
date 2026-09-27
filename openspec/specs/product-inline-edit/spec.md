# product-inline-edit Specification

## Purpose

Kellermeister lets a product's own attributes be edited inline from the cellar bottle view. When a product row is expanded, a pencil affordance toggles the row's detail fields between read-only labels and editable inputs; changes are written through to the product model and persisted so they survive collapsing the row, leaving the page, and synchronization. The product name is kept in sync with its defining attributes (Hersteller, Weinname, Jahrgang, Flaschengrösse), while derived fields and product displays elsewhere remain read-only.
## Requirements
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

While in edit mode, changing an editable input SHALL write the new value to the product model immediately, and the change SHALL be persisted so it survives collapsing the row, leaving the page, and synchronization. The read-only display of every edited field, including the price, SHALL show the product model's current value as soon as edit mode is left, without requiring a reload or a second edit.

#### Scenario: A change is written and persisted
- **WHEN** the user edits an editable field (for example, Region) in edit mode
- **THEN** the product model's corresponding attribute is updated with the new value
- **AND** the value is persisted

#### Scenario: Persisted edit survives a reload
- **WHEN** a user edits a product field, then collapses the row and re-expands it (or reloads the cellar view)
- **THEN** the edited value is shown

#### Scenario: Edited price is shown after leaving edit mode
- **WHEN** the user changes "Preis / Flasche" from 25 to 32 in edit mode and then presses the pencil to leave edit mode
- **THEN** the read-only price shows 32 with its currency

#### Scenario: Edited price is shown after collapsing and re-expanding
- **WHEN** the user changes the price, collapses the row and expands it again
- **THEN** the read-only price shows the new value

### Requirement: Only the product's own attributes are editable

The editable fields SHALL be the product's own attributes: Hersteller, Weinname, Jahrgang, Flaschengrösse, Weinart, Weinfarbe, Region, Land, Traubensorte, Klassifikation, Alkohol, Ausbau, Biologisch, Trinkfenster (from/to), Preis, and Währung. Preis and Währung SHALL be edited on the same line under the label "Preis / Flasche", with a number input for the price followed by a text input for the currency. Hersteller and Weinname SHALL be shown in the expanded view directly below Preis. Derived or aggregated fields — Quelle (the order's seller/date) and Bewertungen (ratings) — SHALL remain read-only in edit mode.

#### Scenario: Derived fields stay read-only
- **WHEN** the row is in edit mode
- **THEN** Quelle and Bewertungen remain read-only labels (no input field)

#### Scenario: Product attributes are editable
- **WHEN** the row is in edit mode
- **THEN** each of the product's own listed attributes is shown as an input field bound to that attribute

#### Scenario: Hersteller and Weinname are shown below the price
- **WHEN** a product row is expanded
- **THEN** Hersteller and Weinname are shown as detail fields directly below Preis / Flasche

#### Scenario: Price and currency on one line
- **WHEN** the row is in edit mode
- **THEN** the "Preis / Flasche" row shows a number input with the current price and, on the same line, a text input with the current currency

#### Scenario: Editing the currency
- **WHEN** the user changes the currency from "CHF" to "EUR" in edit mode and leaves edit mode
- **THEN** the product's currency is "EUR", the change is persisted, and the read-only price shows "EUR"

#### Scenario: Clearing the currency
- **WHEN** the user empties the currency input in edit mode
- **THEN** the product no longer has a currency, and the read-only price shows the price alone

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

### Requirement: The product name is derived from Hersteller, Weinname, Jahrgang and Flaschengrösse

When the user edits Hersteller, Weinname, Jahrgang, or Flaschengrösse, the system SHALL recompute the product's `name` as the space-separated concatenation of Hersteller, Weinname, the Jahrgang year, and the Flaschengrösse suffix, omitting parts that are empty. The recomputed name SHALL be reflected in the row header.

The Flaschengrösse suffix SHALL be derived from the bottle volume in ml as follows:
- 750 ml (standard bottle) or no volume: no suffix
- any other volume: the volume in litres in parentheses followed by `l`, using a decimal point and no trailing zeros — for example 1500 → `(1.5l)`, 3000 → `(3l)`, 375 → `(0.375l)`

The name SHALL NOT be recomputed unless one of these four fields is edited.

#### Scenario: Name recomputed on edit
- **WHEN** the user edits Hersteller, Weinname, Jahrgang, or Flaschengrösse in edit mode
- **THEN** the product's name becomes "<Hersteller> <Weinname> <year> <size suffix>" (empty parts omitted)
- **AND** the row header shows the recomputed name

#### Scenario: Standard bottle has no size suffix
- **WHEN** a product with Hersteller "Gaja", Weinname "Barbaresco", Jahrgang 2019 and Flaschengrösse 750 has its name recomputed
- **THEN** the name is "Gaja Barbaresco 2019"

#### Scenario: Magnum gets a size suffix
- **WHEN** the user changes Flaschengrösse from 750 to 1500 for a product with Hersteller "Gaja", Weinname "Barbaresco", Jahrgang 2019
- **THEN** the name becomes "Gaja Barbaresco 2019 (1.5l)"

#### Scenario: Double magnum gets a whole-litre suffix
- **WHEN** the name is recomputed for a product with Flaschengrösse 3000
- **THEN** the name ends with "(3l)"

#### Scenario: Half bottle gets a fractional suffix
- **WHEN** the name is recomputed for a product with Flaschengrösse 375
- **THEN** the name ends with "(0.375l)"

#### Scenario: Changing back to a standard bottle removes the suffix
- **WHEN** the user changes Flaschengrösse from 1500 to 750 for a product named "Gaja Barbaresco 2019 (1.5l)"
- **THEN** the name becomes "Gaja Barbaresco 2019"

#### Scenario: Editing another name part keeps the size suffix
- **WHEN** the user edits Jahrgang from 2019 to 2020 for a product with Hersteller "Gaja", Weinname "Barbaresco" and Flaschengrösse 1500
- **THEN** the name becomes "Gaja Barbaresco 2020 (1.5l)"

#### Scenario: Missing parts are omitted
- **WHEN** the name is recomputed and one of Hersteller, Weinname, Jahrgang, or the size suffix is empty
- **THEN** that part is omitted and no extra separators remain

#### Scenario: Editing an unrelated field does not change the name
- **WHEN** the user edits a field other than Hersteller, Weinname, Jahrgang, or Flaschengrösse (for example, Region)
- **THEN** the product's name is unchanged

