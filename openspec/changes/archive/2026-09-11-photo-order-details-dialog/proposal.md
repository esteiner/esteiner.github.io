## Why

Today, as soon as the second photo is captured the app immediately posts the images to the conversion service. The user has no chance to add context the photos don't carry — where the bottle was bought or drunk, and what it cost. Capturing those at the moment of adding is far easier than editing later.

## What Changes

- After both photos are captured (camera or file), the app shows a **details dialog** before sending anything to the conversion API.
- The dialog — styled like the existing source-chooser/cellar-delete dialog — has two **optional** text inputs: **Ort (gekauft/getrunken)** and **Preis**.
- The dialog is finished with **Abbrechen** (cancel — abort the add, send nothing) or **Senden** (proceed — send the photos plus any entered details to the conversion API and ingest the result).
- The conversion request gains two **optional** fields (`place`, `price`) carrying those values; they are omitted when blank. The mock conversion service ignores them.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `photo-order-capture`: adds a details-collection step between capture and conversion, and extends the conversion request with optional `place`/`price` fields.

## Impact

- **UI**: `src/infrastructure/web/components/kellermeister-footer.ts` — a new portaled details dialog shown after capture; both the camera and file paths route through it before conversion.
- **Port/impl**: `OrderConversionService.convert` gains an optional `details` argument; `HttpOrderConversionService` includes `place`/`price` in the JSON body when present; `MockOrderConversionService` ignores them.
- **Contract doc**: `src/infrastructure/http/order-conversion-service.openapi.yaml` — add optional `place`/`price` request fields.
- **Tests**: `HttpOrderConversionService.test.ts` (details included when present) and `e2e/specs/photo-order-capture.spec.ts` (dialog appears, cancel aborts, Senden proceeds).
