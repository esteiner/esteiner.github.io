## Why

The details dialog collects a free-text **Preis**, but a price without a unit is ambiguous (CHF? EUR? cents?), and a free-text price lets through non-numeric junk. We want a clean numeric price plus an explicit unit.

## What Changes

- The details dialog gains a **price unit** input on the **same line** as the price (Preis | Einheit).
- The **Preis** input accepts **integers only** (no decimals/letters), and is sent as a JSON **number**.
- The price unit is an **optional free-text** field, sent as an optional string `priceCurrency` (omitted when blank), like `place`.
- The conversion request and the OpenAPI spec are updated: `price` becomes an **integer**, and a new optional **`priceCurrency`** string property is added.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `photo-order-capture`: the details step adds an optional price-unit field and constrains price to integers; the conversion request/contract changes `price` to an integer and adds an optional `priceCurrency`.

## Impact

- **UI**: `src/infrastructure/web/components/kellermeister-footer.ts` — details dialog: price input becomes integer-only, a price-unit input is added on the same row; `handleDetailsSend` reads the integer price and the unit.
- **Port/impl**: `OrderConversionService` — `OrderConversionDetails.price` becomes `number`, add `priceCurrency?: string`; `HttpOrderConversionService` sends `price` as a number and `priceCurrency` as a string (each omitted when absent); `MockOrderConversionService` ignores them.
- **Contract doc**: `src/infrastructure/http/order-conversion-service.openapi.yaml` — `price` type → integer, add optional `priceCurrency` string.
- **Tests**: `HttpOrderConversionService.test.ts` (numeric price + priceCurrency in body) and `e2e/specs/photo-order-capture.spec.ts` (the price-unit field is present on the price line).
