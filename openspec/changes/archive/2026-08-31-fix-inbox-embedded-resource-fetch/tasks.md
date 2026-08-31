## 1. Reproduce

- [x] 1.1 Updated the `SoukaiOrderRepository.test.ts` fixture (`seedInboxWithParties`) to identify embedded parts (order, item, product, seller, customer, contactPoint) with cross-domain absolute URLs (`https://kellermeister.ch/…`, `https://www.boucherville.ch`, `https://schema.org/organization/…`) instead of same-document `#hash` URLs — mirroring the seeded Pod data
- [x] 1.2 Added a case asserting `getProduct()` resolves on the read inbox order; confirmed the suite failed (relations cleared by the fetch path) — pinning the bug

## 2. Fix

- [x] 2.1 Rewrote `fetchUnprocessedOrders` to materialize each inbox order and its embedded parts from the inbox document's RDF graph (`createManyFromDocument`); removed the `loadRelation("seller"/"customer"/"positions")` calls that re-loaded via a fetch of the foreign identifier (and cleared the correct same-document relation)
- [x] 2.2 The item→product link (a non-`usingSameDocument` `belongsToOne`) is auto-hydrated from the document by `createManyFromDocument` (verified by spike) — `getProduct()` returns the embedded product with no fetch; no explicit graph resolution needed
- [x] 2.3 Verified no inbox-read path dereferences an embedded identifier (the remaining `loadRelation` calls are in `fetchOrders`, the LOCAL read path, where products are genuinely separate local resources)

## 3. Verify

- [x] 3.1 `npm run test` green (170 unit tests), including the cross-domain fixture and `getProduct()` assertion
- [x] 3.2 Added `e2e/specs/inbox-ingestion.spec.ts`: ingests the seeded `dhondt-grellet-les-terres-fines-2021` inbox order against the local CSS, asserts 6 bottles land in cellarwork ("6 Flaschen zum umbuchen"), and fails on any request to `kellermeister.ch`
- [x] 3.3 `npm run build` and `npm run test:e2e` green (both e2e specs pass)

## 4. Adjacent inbox regressions surfaced by the fix (scope expansion)

Fixing the read-fetch advanced the ingestion flow and uncovered two more soukai-bis
migration regressions, both broken since the migration and both masked by the
same-document-`#hash` test fixtures. They are the same user symptom ("processing an
inbox file errors"), so they are fixed here to get inbox ingestion green end-to-end.

- [x] 4.1 **Bottle `cellarUrl` construction validation.** soukai-bis parses required fields at construction, so `new SoukaiBottle()` in `SoukaiBottleFactory.createFromProduct` threw (`cellarUrl` required) before `setCellar` runs. Made `cellarUrl` `.optional()` in `SoukaiBottle.schema.ts` (soukai-solid's `required` only applied at save-serialization; RDF output for a bottle that has a cellar is unchanged). Added a unit test exercising the REAL factory→setCellar→save path (the KellermeisterService test mocks the factories, so this was never covered).
- [x] 4.2 **`deleteFromInbox` deleted the synthetic identifier.** bis's `getDocumentUrl()` derives from the model's own url, which for an inbox order is the synthetic `https://kellermeister.ch/orders/1004727` — so the delete issued a CORS-blocked cross-origin request instead of deleting the inbox file. Now `fetchUnprocessedOrders` records each order's source document URL and `deleteFromInbox` deletes that. Added a unit test asserting the inbox FILE (not the `kellermeister.ch` identifier) is deleted.
