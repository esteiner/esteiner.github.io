## Why

The `photo-order-capture` feature always forces the device camera: the footer's hidden input uses `capture="environment"`, so on a phone the user is pushed straight into the rear camera with no way to pick an existing image. But the two images are just files — often the user already has photos of the labels (from the gallery, a download, or a desktop with no camera). Today they cannot use them.

## What Changes

- After tapping **Hinzufügen**, the user first chooses a **source** — **Kamera** (take a photo) or **Datei** (select an existing image) — before capturing the front and back images.
- The chosen source is used for **both** the front and the back image (chosen once per add).
- **Kamera** activates the device camera in-app (live preview via `getUserMedia`) and captures a real photo from the stream on a shutter tap — it does not merely open the OS file dialog, so it works on desktop too; **Datei** opens the normal file/gallery picker (an input without `capture`).
- Both modes produce **image** content, because the conversion service expects photos (file mode restricts the picker to `image/*`; camera mode encodes captured frames as JPEG).
- The rest of the flow is unchanged: two images → conversion service → order Turtle → direct ingestion into the `cellarwork` cellar.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `photo-order-capture`: The "Capture front and back photos from the footer's Add button" requirement changes — the user now selects a capture source (camera or file) once per add, and file selection becomes a first-class option rather than only a fallback when no camera is available.

## Impact

- **UI**: `src/infrastructure/web/components/kellermeister-footer.ts` — add a source chooser (Kamera / Datei) to the capture banner; file mode uses a plain image input; camera mode opens an in-app live-preview overlay (`getUserMedia({video:{facingMode:'environment'}})`) with a shutter that captures a frame via `<canvas>.toBlob('image/jpeg')`, releasing the stream afterwards; thread the chosen source through the existing two-step (front → back) flow.
- **Tests**: extend `e2e/specs/photo-order-capture.spec.ts` to cover the file path and the live-camera path (Chromium fake media stream); no unit-level logic changes expected (conversion/ingestion untouched).
- **No changes** to the conversion service contract, ports, `CDI`, or the ingestion pipeline.
