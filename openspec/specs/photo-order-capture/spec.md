# photo-order-capture Specification

## Purpose

Kellermeister lets the user add wine to the `cellarwork` cellar by photographing a bottle instead of waiting for an order to arrive in the Pod inbox. Activating the footer's **Hinzufügen** button guides the user to capture a front and a back image, which are sent together to an external REST conversion service that returns an order as Turtle. That order is materialized and ingested directly into the `cellarwork` cellar — producing products and one bottle per ordered unit — and the new bottles are shown immediately. The flow indicates progress, prevents double submission, and reports any failure without losing state or presenting a partial result as complete.

## Requirements

### Requirement: Capture front and back photos from the footer's Add button

When the user activates the **Hinzufügen** button in the `kellermeister-footer`, the system SHALL first let the user choose a capture **source** — **camera** (take a photo) or **file** (select an existing image) — via a modal dialog styled consistently with the cellar-deletion confirmation dialog (a centered overlay with a heading and action buttons). The dialog SHALL offer a **cancel** action that aborts the add without starting any capture or conversion. After a source is chosen the system SHALL guide the user to provide **two** images of the wine bottle — first the **front**, then the **back** — before a conversion is attempted. The chosen source SHALL apply to both the front and the back image (chosen once per add). Each image SHALL be image content regardless of source. In file mode the system SHALL open the device's file/gallery picker restricted to images (and MUST NOT force the camera). In camera mode the system SHALL activate the device camera with a live preview and capture a real photo from the camera stream when the user triggers the shutter — it MUST NOT fall back to a file picker. The two images SHALL be clearly attributed as front and back so they can be sent as distinct fields.

The system MUST NOT start a conversion until both the front and the back image are available, and MUST NOT navigate away or start a conversion when the user cancels before both are provided.

#### Scenario: User chooses the camera source
- **WHEN** the user activates the Hinzufügen button and chooses the camera source
- **THEN** the device camera is activated (preferring the environment-facing camera) and shown as a live preview
- **AND** triggering the shutter captures a real photo from the camera stream as the front image, then the same for the back image
- **AND** no file picker is opened

#### Scenario: Camera is unavailable or permission is denied
- **WHEN** the camera source is chosen but the camera cannot be started (no camera, or the user denies permission)
- **THEN** the user is shown a failure and no conversion occurs
- **AND** the camera stream is released (no track is left running)

#### Scenario: Camera stream is released after capture
- **WHEN** both images have been captured from the camera
- **THEN** the camera stream is stopped once the second photo is taken (no track is left running)

#### Scenario: User chooses the file source
- **WHEN** the user activates the Hinzufügen button and chooses the file source
- **THEN** the user is guided to select the front image and then the back image from the device's file/gallery picker
- **AND** the camera is not forced
- **AND** each selection is restricted to image content

#### Scenario: The chosen source applies to both images
- **WHEN** the user chooses a source for an add
- **THEN** both the front and the back image are provided from that same source without asking again

#### Scenario: Source dialog is a cellar-delete-style modal with cancel
- **WHEN** the source chooser is shown
- **THEN** it appears as a centered modal dialog styled like the cellar-deletion confirmation dialog
- **AND** it offers a cancel action that closes the dialog and aborts the add without starting a capture or conversion

#### Scenario: Conversion waits for both images
- **WHEN** only the front image has been provided
- **THEN** no conversion request is made until the back image is also provided

#### Scenario: Cancelled capture does nothing
- **WHEN** the source choice is dismissed, or capture is dismissed before both images are provided
- **THEN** no conversion request is made and the user stays on the current page

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

### Requirement: Convert the photos to an order via the REST conversion service

The system SHALL send both captured images (front and back) together to an external conversion service over HTTP and receive an order as Turtle. The request SHALL be a POST with a JSON body carrying the two images encoded as base64 under distinct fields (front and back); the body SHALL additionally carry the optional user-entered details when provided: **place** (string) and **priceCurrency** (string) when non-empty, and **price** and **quantity** as integer **numbers** when entered (each omitted otherwise). The successful response body SHALL be treated as `text/turtle`. The conversion service endpoint SHALL be read from build-time configuration (`VITE_ORDER_CONVERSION_URL`), and the UI SHALL reach the service only through an application-layer port — never by calling HTTP directly.

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
- **WHEN** the user enters an Ort, a Preis, a currency, and/or an Anzahl and chooses Senden
- **THEN** the POSTed JSON body includes `place` (string), `priceCurrency` (string), `price` (an integer number), and/or `quantity` (an integer number) accordingly
- **AND** a field left empty is omitted from the body

#### Scenario: Conversion service is not configured
- **WHEN** the Hinzufügen flow runs and no conversion endpoint is configured
- **THEN** the user is shown a failure and no ingestion occurs

#### Scenario: Conversion service fails
- **WHEN** the conversion service returns a non-success status or is unreachable
- **THEN** the user is shown a failure and no ingestion occurs

### Requirement: Ingest the converted order directly into the cellarwork cellar

The system SHALL ingest the order Turtle returned by the conversion service directly into the `cellarwork` cellar, without writing it to the Pod inbox. The Turtle SHALL be materialized into order model(s) — with each order's embedded seller, customer, and order items resolved from the document's RDF graph, correlated by subject identifier and without dereferencing those identifiers over the network — using the same embedded-graph materialization the inbox read path uses. For each ordered item with a quantity, the item's product SHALL be persisted and one bottle SHALL be created per ordered unit in the `cellarwork` cellar, and the freshly-built order SHALL be stored locally (to be re-homed to the Pod on the next sync).

Because a converted order has no Pod inbox source document, the ingestion MUST NOT attempt to delete any inbox document for it.

#### Scenario: Converted order becomes products and bottles in cellarwork
- **WHEN** the conversion returns an order with an item of quantity 3
- **THEN** the item's product is saved
- **AND** 3 bottles referencing that product are created in the cellarwork cellar
- **AND** the freshly-built order is stored locally

#### Scenario: No inbox document is deleted for a converted order
- **WHEN** a converted order (which has no inbox source document) is ingested
- **THEN** no Pod inbox deletion request is made for it

#### Scenario: Empty or unparseable Turtle yields no bottles
- **WHEN** the conversion response contains no recognizable order (empty or unparseable Turtle)
- **THEN** no products or bottles are created
- **AND** the user is shown a failure rather than an apparently successful result

### Requirement: The user sees the new bottles after ingestion

After a converted order has been ingested, the system SHALL present the `cellarwork` cellar contents so the newly-created bottles are visible, and any cached read models affected by ingestion (bottles, orders) SHALL be refreshed so the new bottles are not hidden by stale data.

#### Scenario: Cellarwork is shown with the new bottles
- **WHEN** ingestion of a converted order completes successfully
- **THEN** the cellarwork view is presented
- **AND** it reflects the bottles produced by the converted order

### Requirement: The Add flow reports progress and failure without losing state

While a photo is being converted and ingested, the system SHALL indicate that work is in progress and SHALL prevent a second concurrent capture-and-convert from the same button. On failure at any step (conversion or ingestion), the system SHALL report the failure to the user and leave the app usable; a partial failure MUST NOT be presented as a completed add.

#### Scenario: In-progress indication and no double submit
- **WHEN** a conversion/ingestion is already in progress
- **THEN** activating the Add button again does not start a second concurrent conversion

#### Scenario: Failure is reported and the app stays usable
- **WHEN** conversion or ingestion fails
- **THEN** the user is shown the failure
- **AND** the app remains usable (no navigation presenting a partial result as complete)

### Requirement: Camera overlay controls are prominent buttons

The in-app camera overlay SHALL present its **shutter** and **cancel** (Abbrechen) controls as prominent, real button elements — consistent with the app's dialog buttons — not as small icon-links. The shutter SHALL be styled as the primary (filled) button and the cancel as a secondary button, both large enough to be comfortably tappable and legible against the dark camera preview. The cancel button SHALL be positioned before the shutter (cancel on the left, shutter on the right). The shutter's label SHALL name the step it captures — "Vorderseite aufnehmen" for the front photo and "Rückseite aufnehmen" for the back photo — while the cancel button's label SHALL be "Abbrechen". The shutter's colour SHALL differ by step: a pale/light tint for the front photo and the standard green for the back photo. The overlay title SHALL read "Vorderseite" for the front photo and "Rückseite" for the back photo. Button behavior SHALL be unchanged (shutter captures the current photo; cancel aborts the add and releases the camera).

#### Scenario: Shutter and cancel look like real buttons in swapped order
- **WHEN** the camera overlay is shown
- **THEN** the shutter and cancel controls appear as prominent button elements (shutter primary, cancel secondary), legible on the dark preview
- **AND** the cancel ("Abbrechen") button precedes the shutter button

#### Scenario: Shutter label reflects the current step
- **WHEN** the overlay is capturing the front photo
- **THEN** the shutter button is labelled "Vorderseite aufnehmen"
- **WHEN** the overlay advances to the back photo
- **THEN** the shutter button is labelled "Rückseite aufnehmen"

#### Scenario: Shutter colour and title reflect the current step
- **WHEN** the overlay is capturing the front photo
- **THEN** the shutter is a pale/light tint and the overlay title reads "Vorderseite"
- **WHEN** the overlay advances to the back photo
- **THEN** the shutter is the standard green and the overlay title reads "Rückseite"
- **AND** the front and back shutter colours differ

#### Scenario: Button behavior is unchanged
- **WHEN** the user taps the shutter or Abbrechen
- **THEN** the shutter captures the current photo (front, then back) and Abbrechen aborts the add and releases the camera, exactly as before
