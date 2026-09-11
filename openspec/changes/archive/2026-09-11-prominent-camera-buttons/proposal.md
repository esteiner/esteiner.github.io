## Why

In the in-app camera overlay, the **Aufnehmen** (shutter) and **Abbrechen** (cancel) controls are rendered as small `kellermeister-button`s with an unrelated `umbuchen` icon. Against the dark camera preview they read as faint icon-links, not buttons — the primary shutter action in particular is easy to miss. The app already has a clear "real button" style (`.dialog-btn`, used by the source chooser and the cellar-delete dialog); the camera controls should use it.

## What Changes

- Replace the two small `kellermeister-button`s in the camera overlay with real `<button>` elements styled like the app's dialog buttons.
- Make **Aufnehmen** the prominent primary button (filled/green) and **Abbrechen** the secondary button, both clearly button-shaped and comfortably sized/tappable on the dark overlay.
- No behavior change: the shutter still captures front then back; cancel still aborts and releases the camera.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `photo-order-capture`: The camera-capture requirement gains a presentation expectation — the camera overlay's shutter and cancel are prominent, real-looking buttons (shutter primary), replacing the small icon-buttons.

## Impact

- **UI only**: `src/infrastructure/web/components/kellermeister-footer.ts` — `renderCamera()` markup and the `.camera-controls` styles. No changes to capture/conversion/ingestion logic, ports, or config.
- **Tests**: the existing `e2e/specs/photo-order-capture.spec.ts` continues to drive the camera path by button name (**Aufnehmen** / **Abbrechen**); update selectors only if the accessible names change (they do not).
