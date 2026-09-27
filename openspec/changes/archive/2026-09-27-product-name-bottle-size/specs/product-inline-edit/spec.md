## RENAMED Requirements

- FROM: `### Requirement: The product name is derived from Hersteller, Weinname and Jahrgang`
- TO: `### Requirement: The product name is derived from Hersteller, Weinname, Jahrgang and Flaschengrösse`

## MODIFIED Requirements

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
