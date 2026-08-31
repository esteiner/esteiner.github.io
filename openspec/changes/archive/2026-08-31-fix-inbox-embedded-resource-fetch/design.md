## Context

An inbox order is a single Pod document (e.g. `…/inbox/kellermeister/dhondt-grellet-les-terres-fines-2021.ttl`) that embeds every part of the order as distinct RDF subjects:

- Order `https://kellermeister.ch/orders/1004727`
- OrderItem `https://kellermeister.ch/orders/1004727/1` (`schema:orderedItem` of the order)
- Product `https://kellermeister.ch/products/dhondt-grellet-…` (`schema:orderedItem` of the item)
- Seller `https://www.boucherville.ch` (`schema:seller`)
- Customer `https://schema.org/organization/sonja-steiner` + nested ContactPoint (`schema:customer`)

These identifiers are **synthetic and opaque** — they name resources that live only inside this one document; none is a dereferenceable URL.

`SoukaiOrderRepository.fetchUnprocessedOrders` reads the container (`SoukaiOrder.all({from: inbox})`) and then calls `order.loadRelation("seller"/"customer"/"positions")`. In soukai-bis, `Model.loadRelation(name)` unconditionally calls `relation.load()`. For a `BelongsTo*` relation, `load()` → `loadRelatedModels()` computes `documentUrls = foreignKeys.map(urlRoute)` and calls `engine.readDocuments({urls})` — i.e. it **fetches** each foreign-key URL. For an inbox order those are `https://kellermeister.ch/…` on a foreign origin → CORS-blocked preflight, and non-resolvable in any case.

Crucially, `createManyFromDocument` (used by `all()`) already hydrates same-document relations from the document quads via `relation.loadFromDocumentRDF(quads)` — no fetch. The explicit `loadRelation` calls then **discard** that and re-load via the fetching path. The unit test hid this by identifying the embedded parts with same-document hash URLs (`…#seller`), which `urlRoute` maps back to the inbox document URL, so `readDocuments` hits the already-cached inbox doc instead of a foreign host.

## Goals / Non-Goals

**Goals:**
- Ingesting a real inbox order (foreign, opaque identifiers) issues **no** network fetch for those identifiers.
- Order, order items, product, seller, customer, and the customer's contactPoint are all materialized from the inbox document graph.
- The existing observable ingestion behavior (products/bottles created, contactPoint/address/url/weinname carried through) is unchanged.
- A test fixture and an e2e that use cross-domain identifiers, so the regression can't silently return.

**Non-Goals:**
- No change to the inbox document format or the persisted order format.
- No change to sync, re-homing, or the local persisted-order read path (`fetchOrders`).
- No general change to how soukai-bis loads relations elsewhere in the app (local per-resource reads legitimately fetch by URL).
- No CORS proxy / server config: the identifiers must not be fetched at all, so a proxy would be treating the wrong problem.

## Decisions

**1. Build the inbox order from the document graph, not by relation-fetch.** In `fetchUnprocessedOrders`, read each inbox document's quads once and construct the Order and its embedded parts from those quads (bis exposes `createManyFromDocument` / `createFromRDF` / the per-relation `loadFromDocumentRDF`). The order's seller/customer/positions and each item's product are resolved by correlating subjects **within** the document — never by dereferencing a foreign-key URL. Rationale: it matches the data's reality (one self-contained document) and removes the fetch entirely, rather than suppressing its symptom.

- *Preferred implementation:* rely on the hydration `createManyFromDocument` already performs (which calls `loadFromDocumentRDF` for every relation) and drop the explicit `loadRelation` calls — reading the item→product link the same document-first way. Confirm at implementation time whether the item's `product` (a non-`usingSameDocument` `belongsToOne`) is hydrated by `loadFromDocumentRDF`; if not, resolve it from the same document's quads explicitly rather than via `loadRelation`.
- *Alternatives considered:* (a) a vite dev CORS proxy — dev-only, and the URLs don't resolve anywhere, so wrong; (b) rewriting inbox identifiers to same-document hashes before loading — extra transform, and still risks a stray fetch; (c) marking every inbox relation `usingSameDocument` — the persisted-order model intentionally keeps the product as a separate resource, so changing the model to satisfy the inbox read would corrupt the local storage shape.

**2. Treat inbox identifiers as opaque.** The fix must not assume the identifiers share the document's host (they don't) nor that they are fetchable. Resolution is by subject-URI match within the loaded graph only.

**3. Make the tests use real-shaped identifiers.** Change the unit fixture's embedded parts from `…#seller` hash URLs to cross-domain absolute URLs (`https://www.boucherville.ch`, `https://kellermeister.ch/…`), matching the seeded Pod data, so the fixture exercises the no-fetch path. Add an e2e that ingests the seeded inbox order end-to-end against CSS.

## Risks / Trade-offs

- **[The item→product link isn't auto-hydrated from the document]** → the item's `product` is a plain `belongsToOne` (not `usingSameDocument`), so `loadFromDocumentRDF` may not populate it. Mitigation: resolve the product from the same document's quads explicitly (match the item's `productUrl` subject in the graph); assert `getProduct()` in the test using foreign URLs.
- **[Suppressing fetches hides a genuinely-missing resource]** → if a future inbox order legitimately references an out-of-document resource, it would now be absent rather than fetched. Accepted: inbox orders are self-contained by construction; the ingestion contract is document-scoped.
- **[Behavior drift in the persisted-order read path]** → only `fetchUnprocessedOrders` (inbox) changes; `fetchOrders` (local, per-resource) is untouched, and its "resolves each item's product" scenario stays covered.

## Migration Plan

1. Reproduce with a unit test using cross-domain identifiers (fails today with a fetch/CORS or an unresolved relation).
2. Rewrite `fetchUnprocessedOrders` to materialize the order and its parts from the inbox document graph; remove the fetching `loadRelation` calls.
3. Update the existing unit fixture to cross-domain identifiers; keep all current assertions (seller url, customer name/email/address via contactPoint, product weinname).
4. Add an e2e that ingests the seeded `dhondt-grellet-les-terres-fines-2021` inbox order against CSS and asserts the resulting product/bottle, with no fetch to `kellermeister.ch`.
5. `npm run build` + `npm run test:e2e` green.

No rollback data concerns — code + tests only.

## Open Questions

- Does soukai-bis's `createManyFromDocument` hydrate a non-`usingSameDocument` `belongsToOne` (the item→product link) from the document, or must it be resolved explicitly from the graph? Resolve during step 2.
- Is there a shared helper worth extracting (“build all app models from one SolidDocument”) that the sync layer could also use, or is a local resolution in the repository sufficient? Prefer the smallest change unless a second caller appears.
