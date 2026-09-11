## 1. Contract: price integer + priceCurrency

- [x] 1.1 `OrderConversionService.OrderConversionDetails` — change `price` to `number` and add `priceCurrency?: string`.
- [x] 1.2 `HttpOrderConversionService.convert` — include `price` in the body when it is a number, `place`/`priceCurrency` when non-empty strings; keep `{front, back}` shape when nothing is provided.
- [x] 1.3 `MockOrderConversionService.convert` — signature parity (still ignores details).
- [x] 1.4 `order-conversion-service.openapi.yaml` — change `price` to `type: integer`; add optional `priceCurrency` string property.

## 2. Details dialog UI (footer)

- [x] 2.1 Make the Preis input integer-only: `<input type="number" inputmode="numeric" min="0" step="1" class="dialog-input details-price">`.
- [x] 2.2 Add a price-unit input on the **same line** as Preis (e.g. wrap both in a `.dialog-field` with an inline flex row `.dialog-field-inline`; unit input `class="dialog-input details-price-currency"`), with a label like "Preis / Einheit".
- [x] 2.3 Add `.dialog-field-inline` styling to `dialogStyles()` (row layout; price grows, unit narrower).
- [x] 2.4 `handleDetailsSend` — read the integer price (via `valueAsNumber`/parse; include only when `Number.isInteger`), the place, and the price unit; pass `{place, price, priceCurrency}` to `convertAndIngest`.

## 3. Verify

- [x] 3.1 Update `HttpOrderConversionService.test.ts`: numeric `price` and string `priceCurrency` included when present; blank/omitted correctly; `{front, back}` unchanged when no details.
- [x] 3.2 Update `e2e/specs/photo-order-capture.spec.ts`: assert the details dialog exposes the price-unit input on the price line (and the price input is numeric); keep the Senden/Abbrechen flows.
- [x] 3.3 Run `npm run build` and the e2e spec (`VITE_ORDER_CONVERSION_URL=MOCKED …`); confirm green.
