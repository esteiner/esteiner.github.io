## MODIFIED Requirements

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
