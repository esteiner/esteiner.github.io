## Why

Today the only way order data reaches the cellar is by dropping a Turtle order into the Pod inbox (a debug affordance on the profile page) and letting the cellarwork page ingest it. There is no way for a user to add wine from a physical bottle — from the main navigation. The **Hinzufügen** ("Add") button in the footer is a no-op (`// Todo`). We want a user to photograph a wine bottle — its **front** and its **back** label — have both photos converted to a structured order, and see the bottles appear in the `cellarwork` cellar.

## What Changes

- The footer's **Hinzufügen** button starts a two-step photo capture — first the bottle's **front**, then its **back** — instead of doing nothing.
- Both captured photos are sent together to an external **conversion service** over REST (POST JSON `{front: <base64>, back: <base64>}`), which returns an order as Turtle (`text/turtle`).
- The returned order Turtle is **ingested directly into the `cellarwork` cellar** — parsed into order model(s) and turned into products and one bottle per ordered unit — **without** going through the Pod inbox round-trip.
- After ingestion the user is taken to the cellarwork view so the new bottles are visible.
- A new **port** abstracts the conversion service (so the UI never speaks HTTP directly), with an HTTP implementation wired in the `CDI` container and its endpoint configured via a `VITE_` build-time env var.

## Capabilities

### New Capabilities
- `photo-order-capture`: Capturing a photo from the footer's Add button, converting it to an order via the REST conversion service, and ingesting the resulting order directly into the `cellarwork` cellar.

### Modified Capabilities
<!-- None. Ingestion here is a direct path that reuses the existing per-order
     ingestion behavior (products + bottles in cellarwork). It does not go
     through the Pod inbox, so the `inbox-order-ingestion` spec's requirements
     are unchanged. -->

## Impact

- **UI**: `src/infrastructure/web/components/kellermeister-footer.ts` (`handleAddClick`) — two-step camera capture (front then back), progress/error feedback, navigation to cellarwork.
- **Application**: new `OrderConversionService` port under `src/application/ports/`; new use case on `KellermeisterService` to ingest an order from a Turtle string into cellarwork (reusing `ingestOrder`, whose `deleteFromInbox` step is a no-op for an order with no inbox source).
- **Domain/Infra**: `OrderRepository` gains a way to materialize order model(s) from a Turtle string (reusing the same embedded-graph materialization used for inbox reads); implemented in `SoukaiOrderRepository`.
- **Infra/HTTP**: new `HttpOrderConversionService` implementation; wired in `src/infrastructure/cdi/CDI.ts`.
- **Config**: new `VITE_ORDER_CONVERSION_URL` env var (`.env`, `.env.local.example`) for the conversion endpoint; a Vite env typing entry.
- **Dependencies**: none new — reuses `@noeldemartin/solid-utils` (Turtle parsing) and existing Soukai models.
