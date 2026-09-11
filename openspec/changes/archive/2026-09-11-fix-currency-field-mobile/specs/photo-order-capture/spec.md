## MODIFIED Requirements

### Requirement: Collect optional order details before conversion

After both photos are captured (regardless of source) and before the request is sent to the conversion service, the system SHALL show a **details dialog**, styled consistently with the source-chooser / cellar-deletion dialog. The dialog SHALL offer optional inputs — **Ort (gekauft/getrunken)**, **Preis**, a **currency**, and an **Anzahl** (quantity) — and two actions: **Abbrechen** (cancel) and **Senden** (proceed). The currency input SHALL have its own label ("Währung") and SHALL sit on the **same line** as the Preis input; it SHALL show **"CHF"** as a placeholder (not a pre-filled value) so an untouched field is still submitted as empty. The **Anzahl** input SHALL be on its own (third) row with its own label, SHALL default to **1**, and SHALL have the **same width** as the Preis input. The **Preis** and **Anzahl** inputs SHALL accept only integers (no decimals or non-numeric characters). The Preis/Währung row SHALL remain fully within the dialog's content area at any viewport width the dialog supports, including narrow mobile screens, so the currency input never visually overflows the dialog. Cancel SHALL abort the add and send nothing; Senden SHALL proceed to conversion and ingestion. Empty inputs SHALL be permitted (all fields optional).

#### Scenario: Details dialog appears after both photos
- **WHEN** the user has provided both the front and back images
- **THEN** a details dialog with optional "Ort (gekauft/getrunken)", "Preis", "Währung", and "Anzahl" inputs is shown before any conversion request is sent
- **AND** the "Währung" input has its own label and is on the same line as the Preis input
- **AND** the "Anzahl" input is on its own row with its own label, defaults to 1, and matches the Preis input's width

#### Scenario: Währung input shows a CHF placeholder
- **WHEN** the details dialog is shown and the Währung input has not been edited
- **THEN** the input displays "CHF" as placeholder text
- **AND** the input's value remains empty until the user types into it

#### Scenario: Preis/Währung row fits on a narrow mobile screen
- **WHEN** the details dialog is shown on a narrow mobile viewport (e.g. 360px wide)
- **THEN** both the Preis input and the Währung input, including their labels, remain fully visible within the dialog's bounds
- **AND** neither input extends past the dialog's edge or is clipped by the viewport

#### Scenario: Price and quantity accept integers only
- **WHEN** the user fills in the Preis or Anzahl input
- **THEN** only an integer value can be entered (decimals and non-numeric characters are rejected)

#### Scenario: Cancel aborts without sending
- **WHEN** the details dialog is dismissed with Abbrechen
- **THEN** no conversion request is sent and no order is ingested

#### Scenario: Senden proceeds, details optional
- **WHEN** the user chooses Senden with any subset of Ort, Preis, currency, and Anzahl filled in
- **THEN** the photos are sent to the conversion service and the resulting order is ingested
- **AND** the add succeeds even when all fields are left empty
