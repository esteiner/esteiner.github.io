## Why

Processing an order from the Pod inbox fails in the browser with a CORS error:

```
Access to fetch at 'https://kellermeister.ch/orders/1004727/1' from origin
'http://localhost:5173' has been blocked by CORS policy … No
'Access-Control-Allow-Origin' header is present on the requested resource.
```

An inbox order document embeds **all** of its parts — the order, its order items, the product, the seller, and the customer — in a **single** Pod resource, but each is identified by a synthetic, non-dereferenceable absolute URL (`https://kellermeister.ch/orders/1004727/1`, `https://kellermeister.ch/products/…`, `https://www.boucherville.ch`). These identifiers are opaque; they are not meant to be fetched.

Since the soukai-bis migration, `fetchUnprocessedOrders` loads the order's relations via `loadRelation("seller"/"customer"/"positions")`. In soukai-bis `loadRelation()` → `load()` → `loadRelatedModels()` derives a document URL from each foreign-key value and **fetches it** (`engine.readDocuments`). For an inbox order that means issuing a cross-origin request to `https://kellermeister.ch/…`, which is blocked by CORS (and would fail regardless — those URLs resolve to nothing). Inbox ingestion is therefore broken end-to-end.

This was masked by the unit test, whose fixture identifies the embedded parts with **same-document hash** URLs (`…/order#seller`) that soukai-bis resolves from the document without fetching. Real inbox data uses foreign absolute URLs, which are fetched — so the test passes while the app fails.

## What Changes

- **BUGFIX (read):** Read an inbox order's embedded parts (order items, product, seller, customer, contactPoint) from the inbox document's own RDF graph instead of dereferencing their identifiers. No network request is issued for an embedded resource's identifier, regardless of its host.
- Treat an inbox resource identifier as **opaque**: it is used only to correlate resources within the one document, never as a URL to fetch.
- Update the inbox ingestion unit test fixture to identify embedded parts with **cross-domain absolute URLs** (as real inbox data does), so the fixture no longer masks the fetch behavior.
- Cover the fix in the e2e suite: ingest the seeded `dhondt-grellet-les-terres-fines-2021` inbox order against the local Community Solid Server and assert it becomes products/bottles without a network fetch to the synthetic identifiers.

**Scope note — adjacent regressions surfaced during implementation.** Fixing the read-fetch advanced the ingestion flow and revealed two further soukai-bis migration regressions, both broken since the migration and both masked by the same same-document-`#hash` test fixtures. They are the same user symptom (processing an inbox file errors), so they are fixed here to get inbox ingestion working end-to-end:

- **BUGFIX (delete):** `deleteFromInbox` deleted the order's synthetic identifier (`https://kellermeister.ch/orders/…`, derived by soukai-bis's `getDocumentUrl()` from the model's own url) instead of the inbox file — another cross-origin, CORS-blocked request. The repository now tracks each order's source document URL on read and deletes that.
- **BUGFIX (bottle validation):** soukai-bis parses required fields at construction, so `new SoukaiBottle()` in the bottle factory threw (`cellarUrl` required) before the cellar is assigned. `cellarUrl` is made `.optional()` (soukai-solid's `required` applied only at save-serialization; RDF output is unchanged). A unit test now exercises the real factory path (the service test mocks the factories).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `inbox-order-ingestion`: The requirement for reading an order and its embedded parts from the inbox is refined so that embedded resources are resolved from the inbox document graph and their identifiers are never dereferenced — fixing the CORS/fetch failure on real inbox data.

## Impact

- **Code:** `src/infrastructure/soukai/SoukaiOrderRepository.ts` (`fetchUnprocessedOrders` — how order/seller/customer/positions/product are materialized from the inbox document).
- **Possibly:** `src/infrastructure/soukai/model/*` relation loading helpers, if a shared "build from document RDF" path is introduced.
- **Tests:** `src/infrastructure/soukai/SoukaiOrderRepository.test.ts` (fixture uses cross-domain URLs); `e2e/specs/` (new inbox-ingestion spec); reuses the seeded inbox order under `community-solid-server/.volumes/data/edwin/inbox/kellermeister/`.
- **Spec:** `openspec/specs/inbox-order-ingestion/spec.md`.
- **No data-format change:** the inbox document format and the persisted order format are unchanged.
