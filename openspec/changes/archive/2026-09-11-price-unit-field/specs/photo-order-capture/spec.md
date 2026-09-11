## MODIFIED Requirements

### Requirement: Collect optional order details before conversion

After both photos are captured (regardless of source) and before the request is sent to the conversion service, the system SHALL show a **details dialog**, styled consistently with the source-chooser / cellar-deletion dialog. The dialog SHALL offer optional inputs — **Ort (gekauft/getrunken)**, **Preis**, and a **currency** — and two actions: **Abbrechen** (cancel) and **Senden** (proceed). The currency input SHALL have its own label ("Währung") and SHALL sit on the **same line** as the Preis input. The **Preis** input SHALL accept only integers (no decimals or non-numeric characters). Cancel SHALL abort the add and send nothing; Senden SHALL proceed to conversion and ingestion. Empty inputs SHALL be permitted (all fields optional).

#### Scenario: Details dialog appears after both photos
- **WHEN** the user has provided both the front and back images
- **THEN** a details dialog with optional "Ort (gekauft/getrunken)", "Preis", and "Währung" inputs is shown before any conversion request is sent
- **AND** the "Währung" input has its own label and is on the same line as the Preis input

#### Scenario: Price accepts integers only
- **WHEN** the user fills in the Preis input
- **THEN** only an integer value can be entered (decimals and non-numeric characters are rejected)

#### Scenario: Cancel aborts without sending
- **WHEN** the details dialog is dismissed with Abbrechen
- **THEN** no conversion request is sent and no order is ingested

#### Scenario: Senden proceeds, details optional
- **WHEN** the user chooses Senden with any subset of Ort, Preis, and price unit filled in
- **THEN** the photos are sent to the conversion service and the resulting order is ingested
- **AND** the add succeeds even when all fields are left empty

### Requirement: Convert the photos to an order via the REST conversion service

The system SHALL send both captured images (front and back) together to an external conversion service over HTTP and receive an order as Turtle. The request SHALL be a POST with a JSON body carrying the two images encoded as base64 under distinct fields (front and back); the body SHALL additionally carry the optional user-entered details when provided: **place** (string) and **priceCurrency** (string) when non-empty, and **price** as an integer **number** when entered (each omitted otherwise). The successful response body SHALL be treated as `text/turtle`. The conversion service endpoint SHALL be read from build-time configuration (`VITE_ORDER_CONVERSION_URL`), and the UI SHALL reach the service only through an application-layer port — never by calling HTTP directly.

When the endpoint is not configured, or the service responds with a non-success status or an unreachable network, the system SHALL surface a failure to the user and MUST NOT proceed to ingestion.

When the endpoint is configured with the reserved sentinel value `MOCKED`, the system SHALL return a fixed built-in order Turtle directly and MUST NOT make any network request. This is a demo/offline affordance; the mocked service is always available.

#### Scenario: Mocked conversion returns a fixed order without any network request
- **WHEN** the conversion endpoint is configured as `MOCKED` and both images have been captured
- **THEN** a fixed built-in order Turtle is returned and ingested
- **AND** no network request is made to any conversion endpoint

#### Scenario: Both photos are posted as base64 JSON and Turtle is returned
- **WHEN** the front and back images have been captured and the conversion endpoint is configured
- **THEN** the system POSTs a JSON body containing both images as base64 under distinct front and back fields to the configured endpoint
- **AND** the response body is taken as the order Turtle to ingest

#### Scenario: Entered details are included in the request
- **WHEN** the user enters an Ort, a Preis, and/or a price unit and chooses Senden
- **THEN** the POSTed JSON body includes `place` (string) and/or `priceCurrency` (string) and/or `price` (an integer number) accordingly
- **AND** a field left empty is omitted from the body

#### Scenario: Conversion service is not configured
- **WHEN** the Hinzufügen flow runs and no conversion endpoint is configured
- **THEN** the user is shown a failure and no ingestion occurs

#### Scenario: Conversion service fails
- **WHEN** the conversion service returns a non-success status or is unreachable
- **THEN** the user is shown a failure and no ingestion occurs
