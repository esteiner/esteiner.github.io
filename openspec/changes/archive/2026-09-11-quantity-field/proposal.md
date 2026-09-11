## Why

The details dialog captures place, price, and currency, but not how many bottles the photographed order represents. Adding a quantity lets the user record the count at capture time.

## What Changes

- The details dialog gains a **third row** with the label **Anzahl**, an **integer** input, sent as `quantity`.
- `quantity` is **optional** and integer-only (like `price`), sent as a JSON **number** when entered (omitted otherwise).
- The conversion request and the OpenAPI spec gain an optional integer **`quantity`** property.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `photo-order-capture`: the details step adds an optional integer **Anzahl/quantity** field (third row); the conversion request/contract adds an optional integer `quantity`.

## Impact

- **UI**: `src/infrastructure/web/components/kellermeister-footer.ts` — details dialog: a third row with an "Anzahl" label and integer input; `handleDetailsSend` reads the integer quantity.
- **Port/impl**: `OrderConversionService.OrderConversionDetails` gains `quantity?: number`; `HttpOrderConversionService` sends `quantity` as a number when set; `MockOrderConversionService` ignores it.
- **Contract doc**: `src/infrastructure/http/order-conversion-service.openapi.yaml` — add optional integer `quantity` property.
- **Tests**: `HttpOrderConversionService.test.ts` (quantity in body) and `e2e/specs/photo-order-capture.spec.ts` (the Anzahl field is present).

## Note

This change builds on the still-open `price-unit-field` change (same dialog, same requirements). Its spec deltas are written on top of that change's version, so **archive `price-unit-field` first, then this change** to keep `openspec/specs/` consistent.
