## 1. Conversion service port and config

- [x] 1.1 Add `VITE_ORDER_CONVERSION_URL` to `.env` (empty/default) and `.env.local.example`, and add a Vite env typing entry (`ImportMetaEnv`) so `import.meta.env.VITE_ORDER_CONVERSION_URL` is typed.
- [x] 1.2 Create `src/application/ports/OrderConversionService.ts`: `availability(): OrderConversionAvailability` and `convert(front: Blob, back: Blob): Promise<string>` (returns Turtle), plus the `OrderConversionAvailability` union (`{available:true} | {available:false; reason:string}`), mirroring `InboxUploader`.

## 2. HTTP implementation

- [x] 2.1 Create `src/infrastructure/http/HttpOrderConversionService.ts` implementing `OrderConversionService`: `availability()` returns unavailable with a reason when the endpoint is empty; `convert()` reads both images as base64, POSTs JSON `{ front: <base64>, back: <base64> }` to the configured URL, and returns `response.text()` as Turtle on `response.ok`, else rejects with a message including the status.
- [x] 2.2 Wire `HttpOrderConversionService` into `CDI`: construct it from the env-var endpoint and expose `getOrderConversionService(): OrderConversionService`.
- [x] 2.3 Add `MockOrderConversionService` (always available; returns a fixed built-in order Turtle, no network). In `CDI`, select it when `VITE_ORDER_CONVERSION_URL` equals the sentinel `MOCKED`, else use the HTTP impl.
- [x] 2.4 Document the conversion service HTTP contract as an OpenAPI spec at `src/infrastructure/http/order-conversion-service.openapi.yaml` (POST JSON `{front, back}` base64 → `text/turtle`).

## 3. Materialize orders from Turtle (repository)

- [x] 3.1 Add `parseOrders(turtle: string): Promise<Order[]>` to `OrderRepository` (`src/domain/Order/OrderRepository.ts`).
- [x] 3.2 Implement it in `SoukaiOrderRepository`: parse Turtle (via `@noeldemartin/solid-utils`) into the engine-document shape `SoukaiOrder.createManyFromDocument` consumes and return the materialized orders, resolving embedded seller/customer/positions from the graph WITHOUT dereferencing embedded identifiers (same guarantee as `fetchUnprocessedOrders`). Do not set `inboxSourceUrl`.

## 4. Ingest converted order (application)

- [x] 4.1 Add `ingestOrderFromTurtle(turtle: string): Promise<Cellar>` to `KellermeisterService`: resolve the cellarwork cellar, `parseOrders(turtle)`, then `ingestOrder(order, cellarworkId)` for each; return the cellarwork cellar. Reject when the Turtle yields no order. (`deleteFromInbox` remains a no-op for these orders.)
- [x] 4.2 Ensure read-model caches are invalidated (relies on `ingestOrder` nulling `cachedOrders`/`cachedBottles`).

## 5. Footer capture flow (UI)

- [x] 5.1 In `kellermeister-footer.ts`, add a hidden `<input type="file" accept="image/*" capture="environment">` and make `handleAddClick` drive a two-step capture: prompt for the front image, then re-open the input for the back image (reset value between steps, label the current step for the user); abort quietly if the user cancels before both are captured.
- [x] 5.2 Once both front and back blobs are held, guard against re-entry (in-progress flag), then call `getOrderConversionService().convert(front, back)` and `getKellermeisterService().ingestOrderFromTurtle(ttl)`.
- [x] 5.3 On success, `Router.go` to the cellarwork page so the new bottles are shown; reset the input value and captured blobs to allow a fresh add.
- [x] 5.4 Show in-progress indication and, on conversion/ingestion failure (including endpoint not configured), surface the failure without navigating; keep the app usable.

## 6. Tests

- [x] 6.1 Unit-test `HttpOrderConversionService`: availability when endpoint unset; base64 JSON POST shape with distinct `front`/`back` fields; Turtle returned on 2xx; rejection on non-2xx / network error.
- [x] 6.4 Unit-test `MockOrderConversionService`: always available; `convert()` returns the fixed Turtle and makes no network request.
- [x] 6.2 Test `SoukaiOrderRepository.parseOrders`: an order Turtle with embedded seller/customer/two items materializes with `getProduct()` resolved and no network dereference of embedded identifiers.
- [x] 6.3 Test `KellermeisterService.ingestOrderFromTurtle`: quantity 3 → product saved + 3 bottles in cellarwork + order saved locally; no `deleteFromInbox` request; empty/unparseable Turtle rejects with no bottles.

## 7. Verify end-to-end

- [x] 7.1 With `VITE_ORDER_CONVERSION_URL` set to a stub returning a sample order Turtle, capture/pick front and back images via Hinzufügen and confirm bottles appear in the cellarwork cellar; with the var unset, confirm a clean "not available" failure.
