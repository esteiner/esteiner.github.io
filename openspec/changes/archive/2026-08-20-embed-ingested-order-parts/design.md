## Context

Order ingestion (`KellermeisterService.ingestOrder` → `addBottles` → `moveProcessedOrder`) has two intertwined problems:

1. **The built order is discarded.** `addBottles` constructs `newOrder = orderFactory.createOrder(order)` and attaches new `SoukaiOrderItem`s that reference the newly-created local products, but never saves `newOrder`. `moveProcessedOrder` instead persists `unprocessedOrder.clone()` — the raw inbox order. Its items still reference the inbox product URLs, which are deleted when the inbox source is removed, leaving dangling references.
2. **Customer is never carried over.** `SoukaiOrder` has a `customerUrl` key field (`schema:customer`) but no relationship and no model; the factory copies only the seller.

Soukai already supports same-document embedding: `SoukaiOrder.sellerRelationship()` and `positionsRelationship()` use `.usingSameDocument(true)`. `fetchUnprocessedOrders` currently loads `seller` and `positions`. The seller is modeled by `SoukaiSeller` (schema:Organization, fields name/email/url).

Confirmed with the user: the customer is the object referenced by `schema:customer`, and the order that gets persisted should be the freshly-built one.

## Goals / Non-Goals

**Goals:**
- Persist the freshly-built order (items referencing local products) as a single, self-contained RDF document.
- Embed seller, customer, and all order items in that one document via same-document relationships.
- Add a first-class `customer` on the order (domain + Soukai model + relationship) sourced from `schema:customer`, mirroring the seller.
- Tolerate a missing seller/customer without error.

**Non-Goals:**
- Changing product/bottle creation in `addBottles` (products remain their own Pod resources referenced by URL — order items point at them; only the seller/customer/items embed in the order document).
- Changing sync/re-home behavior (the single document re-homes like any other resource).
- Defining rich customer attributes beyond what the seller has; the customer model mirrors the seller (name/email) unless the source provides more.

## Decisions

### Decision 1: Persist the built order, not the clone
`addBottles` returns the `newOrder` it constructs; `ingestOrder` saves that order via `orderRepository.saveProcessedOrder(newOrder)` and then deletes the inbox source via `orderRepository.deleteFromInbox(originalOrder)`. `moveProcessedOrder` (which cloned the raw order) is removed/rewritten accordingly.

- **Why:** the built order's items reference the real local products; the clone's do not. Saving the built order fixes dangling references and satisfies "same document".
- **Order of operations:** save the built order locally first, then delete the inbox source — never lose an already-processed order if deletion fails (consistent with the existing invariant).
- **Alternative considered:** rewrite the clone's item/product references to the new local URLs. Rejected — the factory already builds a correct order; reusing it is simpler and less error-prone.

### Decision 2: Model the customer symmetrically to the seller
Add a domain `Customer` interface, `Order.getCustomer(): Customer | undefined`, a `SoukaiCustomer` model (name/email/url, `timestamps = false`), and a `customerRelationship()` on `SoukaiOrder` = `belongsToOne(SoukaiCustomer, "customerUrl").usingSameDocument(true)`. `SoukaiOrderFactory.createOrder` copies the customer from the source order (guarded, like the seller). `fetchUnprocessedOrders` additionally loads the `customer` relation. `SoukaiCustomer` is booted alongside the other order models.

- **Why:** the seller pattern is proven and same-document; the customer is the same shape of embedded object.
- **RDF type — `schema:Organization`, not `schema:Person`:** the real inbox pipeline models the `schema:customer` object exactly like the seller — a `schema:Organization` node (a named party with an address and a nested `schema:contactPoint`), e.g. `notes/data/inbox-orders/dhondt-grellet-les-terres-fines-2021`. `SoukaiCustomer` must match `schema:Organization`; matching `schema:Person` (the initial assumption) meant `belongsToOne(SoukaiCustomer, "customerUrl")` never resolved the node, so the customer silently loaded as `undefined` and never reached ingestion or sync (`createOrder: no customer found`). Fields mirror the seller (name/email/url) plus `address` — the customer Organization carries a `schema:address` (a plain literal on the node) the seller does not, carried through the factory and sync alongside the other fields. The two same-typed relations stay distinct because they are keyed by different foreign keys (`sellerUrl`/`customerUrl` → `schema:seller`/`schema:customer`).
- **Contact details via `schema:contactPoint`:** the customer Organization carries its name directly but its email on a nested `schema:ContactPoint` (same document), e.g. the `sonja-steiner/contact` node in the example. A `SoukaiContactPoint` model (schema:ContactPoint; name/email) and a same-document `contactPoint` relationship on `SoukaiCustomer` capture it; `getName()`/`getEmail()` prefer the contactPoint and fall back to the Organization's own fields. The contactPoint is **preserved as a nested same-document resource** (order → customer → contactPoint, all one document), not flattened: the factory copies the source customer's contactPoint into the built order; `fetchUnprocessedOrders`/`fetchOrders` load `customer.contactPoint`; and the sync `rebuildOrder`/`loadEmbedded` carry the nested contactPoint so it re-homes to the Pod with the order. (A `getName()`/`getEmail()` flatten was considered — simpler for sync — but rejected because it drops the `schema:contactPoint` structure from the Pod document, losing fidelity with the source.)
- **Alternative considered:** treat the customer as an external WebID reference (key only, not embedded). Rejected per the requirement that it be saved in the same document, and per the user's framing of it as the referenced object.

### Decision 3: Keep products as separate resources
Order items embed in the order document, but each item's `productUrl` continues to reference a Product persisted as its own resource. Embedding products into the order document would duplicate product data and break the per-resource product model that bottles also reference. So "all order items in the same document" means the item nodes (quantity/price/productUrl), not the products themselves.

### Decision 4: Preserve embedded relations through the sync re-home
`SolidSyncService` re-homes provisional resources and creates them on the Pod by reconstructing each model from `model.getAttributes()`. That bag holds only the model's own scalar fields — **not** its related models — so the order's embedded seller, customer, and order items were silently dropped when the order was re-homed/created, defeating the whole point of same-document embedding (the persisted-locally order was correct, but nothing inside it reached the Pod).

Fix: the `orders` collection is flagged `embedded`. Before reconciling, the sync loads `seller`/`customer`/`positions` (each side under the engine that read it), and a dedicated `rebuildOrder` re-creates the order at its target URL with fresh seller, customer, and item models attached — the same shape the ingestion factory produces, which `save()` embeds into one document. Each item's cross-resource `productUrl` is re-homed to the Pod base; products are swept before orders (spec order), so the product's Pod URL already exists. This runs on every reconstruction path: re-home, local→Pod create, and Pod→local create. The both-present path uses soukai's `synchronize()` with relations loaded, which reconciles the embedded models.

- **Why not `getAttributes()` + ref-rewriting (as for bottles)?** Bottles reference products by a top-level `productUrl` field, which the existing `refFields` re-homing handles. An order's parts are *nested* related models (and the items' `productUrl` is nested inside each item), unreachable by top-level field rewriting — they must be re-created, not copied.
- **Why not `clone()`?** `clone()` carries relations but keeps every URL; re-homing a same-document graph to the Pod base would require re-minting the parent and every embedded fragment URL, with no clean public API. Rebuilding fresh (letting `save()` mint the same-document fragments) mirrors the proven ingestion path.

## Risks / Trade-offs

- **[The built order items may lack `productUrl` linking to the new product]** → Ensure `addBottles`/factory sets the order item's `productUrl` to the created product's URL so the embedded items reference real local products; cover with a test asserting the persisted item's `productUrl`.
- **[Customer RDF shape differs from the assumed schema:Person/name/email]** → The model reads whatever maps to its fields; unknown properties are ignored. A missing customer is tolerated (no error). If richer fidelity is needed, the model can gain fields later.
- **[Removing `moveProcessedOrder`/clone path changes behavior other callers rely on]** → `moveProcessedOrder` is private and only used by ingestion; scope is contained. Verify no other references.
- **[Same-document save must actually embed related models]** → The relationships already declare `usingSameDocument(true)`; add a test asserting seller, customer, and items share the order's document URL after save.

## Migration Plan

Code-only; no data migration. Previously ingested orders remain as they are. Newly ingested orders become single, self-contained documents with embedded seller, customer, and items. Rollback reverts to the prior (clone-saving) behavior without touching stored data.

## Open Questions

None — customer semantics (object referenced by `schema:customer`) and the persisted-order choice (freshly-built) were confirmed with the user.
