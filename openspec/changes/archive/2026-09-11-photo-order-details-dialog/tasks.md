## 1. Conversion request carries optional details

- [x] 1.1 `OrderConversionService.convert` — add an optional `details?: OrderConversionDetails` param (`{place?: string; price?: string}`); export the type.
- [x] 1.2 `HttpOrderConversionService.convert` — accept `details` and include `place`/`price` in the JSON body only when non-empty (leave `{front, back}` unchanged when absent).
- [x] 1.3 `MockOrderConversionService.convert` — accept and ignore `details` (signature parity).
- [x] 1.4 `order-conversion-service.openapi.yaml` — add optional `place` and `price` string properties to `ConversionRequest`.

## 2. Details dialog (footer)

- [x] 2.1 Add state: `@state() detailsOpen = false` and fields `pendingFront`/`pendingBack`. On both capture completions (file back-select and camera back-shutter), call a new `openDetails(front, back)` instead of `convertAndIngest` directly.
- [x] 2.2 Generalize the portal: `updatePortal()` renders the source chooser OR the details dialog; share the dialog styles (neutral wrapper class) and add input styling.
- [x] 2.3 Add `renderDetailsDialog()` styled like the source dialog: heading, two optional text inputs ("Ort (gekauft/getrunken)", "Preis"), and actions **Abbrechen** / **Senden**.
- [x] 2.4 `handleDetailsSend()` — read `place`/`price` from the portal inputs (trim; empty → omitted) and call `convertAndIngest(pendingFront, pendingBack, {place, price})`; close the dialog. `handleDetailsCancel()` — clear pending blobs and reset (send nothing). Overlay-click cancels.
- [x] 2.5 `convertAndIngest` — accept the optional `details` and pass it to `convert(...)`.

## 3. Verify

- [x] 3.1 Add an `HttpOrderConversionService` unit test: details included in the body when present; omitted when empty.
- [x] 3.2 Update `e2e/specs/photo-order-capture.spec.ts`: after capturing (file and camera paths), the details dialog appears; fill Ort/Preis (or leave empty) and click **Senden** to ingest; add a case where **Abbrechen** aborts with no ingestion.
- [x] 3.3 Run `npm run build` and the e2e spec (`VITE_ORDER_CONVERSION_URL=MOCKED …`); confirm green.
