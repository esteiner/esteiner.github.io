## 1. Prominent camera buttons (footer)

- [x] 1.1 In `renderCamera()` (`kellermeister-footer.ts`), replace the two `kellermeister-button`s with real `<button>` elements: `Aufnehmen` (primary) wired to `handleShutter`, `Abbrechen` (secondary) wired to `handleCameraCancel`. Keep the exact German labels.
- [x] 1.2 Add `.camera-btn`, `.camera-btn-primary`, `.camera-btn-secondary` styles (mirroring `.dialog-btn` / `-ok` / `-cancel`) but more prominent: larger padding/font, `min-width`, good contrast on the dark overlay; primary = filled green, secondary = light background.
- [x] 1.3 Keep `.camera-controls` layout (adjust gap/width if needed so the buttons are comfortably tappable, e.g. side-by-side and reasonably wide).

## 2. Verify

- [x] 2.1 Run `npm run build` (tsc + unit tests + vite); confirm green.
- [x] 2.2 Run the camera e2e path (`VITE_ORDER_CONVERSION_URL=MOCKED npx playwright test -c e2e/playwright.config.ts photo-order-capture`); confirm the Aufnehmen/Abbrechen buttons still resolve by name and the flow passes.

## 3. Swap positions and step-specific shutter label

- [x] 3.1 In `renderCamera()`, swap the control order so **Abbrechen** precedes the shutter (cancel left, shutter right).
- [x] 3.2 Label the shutter per step: "Vorderseite aufnehmen" for the front photo and "Rückseite aufnehmen" for the back photo (`this.capturing`-driven).
- [x] 3.3 Update the camera e2e to click the step-specific shutter labels; re-run `npm run build` and the e2e spec; confirm green.

## 4. Step-specific shutter colour and shorter title

- [x] 4.1 Colour the shutter by step: lighter green for the front photo, standard green for the back (add a `.camera-btn-primary-light` style; pick the class via `this.capturing`).
- [x] 4.2 Shorten the overlay title to "Vorderseite" / "Rückseite" (drop "fotografieren").
- [x] 4.3 Update the camera e2e (title text now exact "Vorderseite"/"Rückseite"; assert the front vs back shutter background colours differ); re-run `npm run build` and the e2e spec; confirm green.
