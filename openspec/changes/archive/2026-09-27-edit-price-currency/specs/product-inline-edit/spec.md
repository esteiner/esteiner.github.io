## MODIFIED Requirements

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
