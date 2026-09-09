## 1. Source selection state and inputs (footer)

- [x] 1.1 In `kellermeister-footer.ts`, add `@state() private source: 'camera' | 'file' | null = null` and reset it (to `null`) in `handleAddClick` alongside the existing state reset.
- [x] 1.2 Change `handleAddClick` so that, after the availability check, it sets `capturing = 'front'` but does NOT open a capture yet (the banner will show the source chooser). Do not open any input here.
- [x] 1.3 Render two hidden inputs in `render()`: `.capture-input-camera` (`type="file" accept="image/*" capture="environment"`) and `.capture-input-file` (`type="file" accept="image/*"`), both wired to `handleCaptureChange`.
- [x] 1.4 Update `openCapture()` to select the input by `this.source` (camera → `.capture-input-camera`, file → `.capture-input-file`), reset its value, and click it.

## 2. Source chooser UI (footer)

- [x] 2.1 Add `handleSourceClick(source: 'camera' | 'file')`: set `this.source`, clear `error`, and call `openCapture()` for the front image (a user gesture).
- [x] 2.2 In `renderBanner()`, add a state for `capturing === 'front' && this.source === null`: show a prompt ("Quelle wählen") with two `kellermeister-button`s — **Kamera** (`handleSourceClick('camera')`) and **Datei** (`handleSourceClick('file')`).
- [x] 2.3 Keep the `capturing === 'back'` banner; its button re-opens the chosen source via `openCapture()` (now source-aware). Label/behaviour otherwise unchanged.
- [x] 2.4 Ensure `convertAndIngest` and the reset paths also clear `this.source` (back to `null`) so a later add starts at the chooser.

## 3. Verify

- [x] 3.1 Extend `e2e/specs/photo-order-capture.spec.ts` (or add a sibling test) so that, after tapping Hinzufügen, it selects **Datei**, then supplies the front and back images to the file input; assert the order is ingested into cellarwork (bottle count increases) and the camera was not forced.
- [x] 3.2 Keep/adjust a camera-path assertion: after Hinzufügen, choose **Kamera**, supply front+back, and assert ingestion still works.
- [x] 3.3 Run `npm run build` (tsc + unit tests + vite) and the e2e spec (`VITE_ORDER_CONVERSION_URL=MOCKED npx playwright test -c e2e/playwright.config.ts photo-order-capture`); confirm green.

## 4. In-app live camera capture (footer)

- [x] 4.1 Replace the `.capture-input-camera` hidden input with an in-app camera: `handleSourceClick('camera')` starts `navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})`, storing the `MediaStream` in state; on failure set `error` and reset (no leaked tracks).
- [x] 4.2 Render a live camera overlay while the stream is active: a `<video autoplay playsinline muted>` bound to the stream (attach `srcObject` in `updated()`), with **Aufnehmen** (shutter) and **Abbrechen** (cancel) buttons and a front/back label.
- [x] 4.3 Implement `handleShutter()`: draw the current video frame to a `<canvas>`, `canvas.toBlob(..., 'image/jpeg')`; on front → hold blob, advance to back (keep stream); on back → stop the stream, then `convertAndIngest(front, back)`.
- [x] 4.4 Implement stream teardown: a `stopCamera()` that stops all tracks and clears the stream, called on cancel, on error, after the second capture, and in `disconnectedCallback`.
- [x] 4.5 Keep the file path unchanged (`.capture-input-file`); `openCapture()` only handles the file source now.

## 5. Re-verify

- [x] 5.1 Add Chromium fake-media launch flags (`--use-fake-device-for-media-stream`, `--use-fake-ui-for-media-stream`) so `getUserMedia` resolves headlessly, and update the camera-path e2e to shutter front+back and assert ingestion; keep the file-path assertion.
- [x] 5.2 Re-run `npm run build` and the e2e spec; confirm green.

## 6. Source chooser as a cellar-delete-style modal

- [x] 6.1 Replace the source chooser banner with a modal dialog matching the cellar-deletion dialog (overlay + centered card, heading, `dialog-btn` buttons). Because the footer host's `backdrop-filter` traps `position:fixed`, portal the dialog into `document.body` (Lit `render`) with the dialog CSS inlined/scoped so `inset:0` covers the viewport; remove the portal on hide and in `disconnectedCallback`.
- [x] 6.2 Add a **Abbrechen** (cancel) action (and overlay-click) that aborts the add via `resetCapture()`; keep **Kamera** and **Datei** as the choices.
- [x] 6.3 Update `e2e/specs/photo-order-capture.spec.ts`: assert the source dialog appears, exercise the cancel button (no ingestion), and keep the Kamera/Datei add flows working through the dialog. Re-run build + e2e; confirm green.
