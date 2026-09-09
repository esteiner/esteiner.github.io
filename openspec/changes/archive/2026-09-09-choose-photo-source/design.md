## Context

`photo-order-capture` drives a two-step capture from `kellermeister-footer`: `handleAddClick` opens a single hidden `<input type="file" accept="image/*" capture="environment">`, the change handler stores the front image and flips `capturing` to `'back'`, a banner shows a "Rückseite" button that re-opens the same input, and once both blobs are held `convertAndIngest(front, back)` runs. The `capture="environment"` attribute forces the rear camera on mobile, so an existing image can never be chosen there.

This change adds an explicit source choice (camera vs file) at the start of an add, chosen once and applied to both images. Everything downstream (conversion, ingestion, navigation, the `CELLAR_UPDATED_EVENT` refresh) is untouched.

## Goals / Non-Goals

**Goals:**
- Let the user pick **Kamera** or **Datei** after tapping Hinzufügen, then capture front + back from that source.
- Keep camera mode identical to today (`capture="environment"`).
- Keep both modes image-only.

**Non-Goals:**
- No per-image source choice (front and back share one source per add).
- No change to the conversion contract, ports, CDI, or ingestion.
- No non-image file support.

## Decisions

### Decision 1: File mode uses a hidden input; camera mode uses an in-app `getUserMedia` preview

- **File mode:** a hidden `<input type="file" accept="image/*">` (no `capture`), clicked to open the file/gallery picker. Its `change` handler feeds the two-step flow.
- **Camera mode:** the app activates the device camera itself with `navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}})`, shows the stream in a `<video autoplay playsinline muted>` overlay, and on a shutter tap draws the current frame to a `<canvas>` and encodes it with `canvas.toBlob(..., 'image/jpeg')` — that Blob is the captured image. The same overlay is reused for the front and then the back photo; the stream is stopped (all tracks) once the second photo is taken, on cancel, on error, and on `disconnectedCallback`.

- **Why an in-app camera rather than `<input capture="environment">`:** the `capture` attribute only opens the OS camera on some mobile browsers and is ignored on desktop (it just opens a file dialog), so it does not guarantee taking a real photo. `getUserMedia` activates the actual camera and captures a real frame on every platform that has one.
- **Why JPEG:** compact for the base64 upload; the conversion service takes a photo, not a lossless asset.
- **Alternative — `ImageCapture.takePhoto()`:** higher quality still-capture, but patchy browser support (not in Safari/Firefox); the canvas-frame approach works wherever `getUserMedia` does.

### Decision 2: Source is state, chosen once per add

Add `@state() private source: 'camera' | 'file' | null`. `handleAddClick` no longer opens a capture immediately; it checks availability, resets state, and sets `capturing = 'front'` **without** a source yet, so the banner renders the source chooser (Kamera / Datei buttons). Picking a source sets `this.source` and opens the first capture. `openCapture()` selects the input by `this.source`. The back step reuses the same source.

- **Why once per add:** matches the chosen UX (see proposal) and keeps the banner simple. The back-step button ("Rückseite") just re-opens the same-source input.

### Decision 3: Keep the existing user-gesture model

Each capture is opened from a real click (the Kamera/Datei buttons for the front, the Rückseite button for the back), preserving transient activation — the same reason the current design uses a button for the back step rather than chaining `.click()` inside the change handler.

## UI states

The capture banner (`renderBanner`) gains a source-choose state and keeps the rest:
- `busy` → "Bestellung wird erstellt…"
- `error` → the error text
- `capturing === 'front' && source === null` → "Quelle wählen" + **Kamera** / **Datei** buttons
- `capturing === 'back'` (file source) → "Vorderseite erfasst. Jetzt die Rückseite …" + a button that re-opens the file picker
- otherwise → nothing

For the **camera** source, a separate live overlay is shown whenever the stream is active (front or back step): the `<video>` preview plus an **Aufnehmen** (shutter) button and an **Abbrechen** (cancel) button, and a label indicating front vs. back. The shutter drives the same front→back progression; cancel stops the stream and resets.

## Risks / Trade-offs

- **`capture` support varies by browser** → In file mode we simply omit `capture`, which is the well-supported default (a normal picker). In camera mode behaviour is exactly today's, so no regression.
- **Two inputs in the DOM** → Negligible; both are `display:none` and share one handler.
- **Wording/labels (German)** → Use "Kamera" / "Datei" to match the app's German UI; low risk.

## Migration Plan

Purely additive UI change in one component. No data, config, or API changes; nothing to roll back beyond reverting the component. Existing behaviour is reachable by choosing **Kamera**.

## Open Questions

- None. (Source granularity and file-type restriction were decided: once per add, images only.)
