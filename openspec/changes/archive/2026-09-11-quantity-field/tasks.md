## 1. Contract: quantity integer

- [x] 1.1 `OrderConversionService.OrderConversionDetails` — add `quantity?: number`.
- [x] 1.2 `HttpOrderConversionService.convert` — include `quantity` in the body when it is a number.
- [x] 1.3 `MockOrderConversionService.convert` — signature parity (still ignores details).
- [x] 1.4 `order-conversion-service.openapi.yaml` — add optional `quantity` property with `type: integer`.

## 2. Details dialog UI (footer)

- [x] 2.1 Add a third row to `renderDetailsDialog()`: a `.dialog-field` with label "Anzahl" and `<input type="number" inputmode="numeric" min="0" step="1" class="dialog-input details-quantity">`, placed after the Preis/Währung row.
- [x] 2.2 `handleDetailsSend` — read the integer quantity (via `valueAsNumber`; include only when `Number.isInteger`) and pass it in the details object to `convertAndIngest`.

## 3. Verify

- [x] 3.1 Update `HttpOrderConversionService.test.ts`: numeric `quantity` included when present; omitted when absent.
- [x] 3.2 Update `e2e/specs/photo-order-capture.spec.ts`: assert the "Anzahl" field is present (numeric); fill it and Senden.
- [x] 3.3 Run `npm run build` and the e2e spec (`VITE_ORDER_CONVERSION_URL=MOCKED …`); confirm green.
