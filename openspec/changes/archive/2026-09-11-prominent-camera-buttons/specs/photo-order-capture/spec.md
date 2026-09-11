## ADDED Requirements

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
