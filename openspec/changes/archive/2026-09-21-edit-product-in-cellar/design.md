## Context

The cellar bottle view renders each product row as a `bottle-component`: a header (`.product-name` span) whose click toggles `expanded`, and, when expanded, a `product-component` showing the product's detail fields as read-only labels. `product-component` is also used by `order-item-component` (order view). `Product` (domain) currently exposes **only getters**; `SoukaiProduct` maps them to RDF fields. Persistence goes through `ProductRepository.save` (local-first IndexedDB, synced to the Pod). Some components already use `CDI.getInstance()` (footer, sync-status).

Two rendered fields are not plain product attributes: **Preis/Flasche** is provided as slotted content by the parent (`bottle.getPrice()`), and **Quelle**/**Bewertungen** are derived from the order / aggregated from bottles.

The requested flow (see `notes/ui/edit-product-in-cellar.jpg`): expand a row → a pencil appears right-aligned in the header → clicking it turns detail fields into inputs → edits write through to the model instantly and persist → clicking the header collapses (and leaves edit mode).

## Goals / Non-Goals

**Goals:**
- Toggle a product row's detail fields between labels and inputs via a pencil in the header.
- Write each input change to the product model immediately and persist it durably.
- Scope editing to the cellar view; keep the order view read-only.
- Keep Quelle and Bewertungen read-only.

**Non-Goals:**
- Editing the product **name** (it is the header/expand control, not a detail field).
- Editing derived/aggregated data (Quelle, Bewertungen).
- Undo/validation UI beyond native input behavior; add/delete of products.
- A separate edit page or modal — editing is inline.

## Decisions

### Decision 1: `bottle-component` owns expand + edit state; `product-component` receives `editing`
The pencil lives in the header (owned by `bottle-component`), so `bottle-component` holds a new `editing` state alongside `expanded`, renders the pencil only when `expanded`, and passes `.editing=${this.editing}` to `product-component`. `product-component` renders inputs when `editing` is true, labels otherwise.

- **Why:** The header and the fields are in two components; the toggle is triggered in the header but changes the fields. A one-way `editing` property keeps the data flow simple and naturally scopes editing to `bottle-component` — `order-item-component` never sets `editing`, so the order view stays read-only with no extra flag.
- **Interaction rules:** pencil click calls `stopPropagation()` (so it does not bubble to the header's collapse handler) and toggles `editing`; header click toggles `expanded` and, when collapsing, resets `editing = false`.
- **Alternatives considered:** *Move the header into `product-component`* — rejected, it would duplicate the count slot and expand logic that `bottle-component` already owns. *An `editable` capability flag on `product-component` plus internal edit state* — more moving parts than passing `editing` down.

### Decision 2: Add setters to `Product` / `SoukaiProduct`, persist via a new `KellermeisterService.updateProduct`
Add setters for the editable attributes to the `Product` interface and implement them in `SoukaiProduct` (assigning the mapped RDF fields). Add `KellermeisterService.updateProduct(product)` that calls `ProductRepository.save(product)`.

- **Why:** The model is getter-only today; write-through needs setters. Persisting through the service (not the repository directly from the component) keeps the component within the app's existing access pattern and gives one place to evolve persistence.
- **Cache note:** the cellar view holds the same product instances it renders (shared via the in-memory join), so an in-place edit + save shows immediately without cache invalidation; `updateProduct` therefore only persists and does **not** drop caches (which would refetch and could re-collapse/reorder the row).

### Decision 3: Write to the model on `input`, persist on field commit (`change`)
On every `input` event the component calls the matching setter (the model is updated instantly, per the requirement). Persistence (`updateProduct`) is triggered on the field's `change` event (blur / Enter) and when leaving edit mode / collapsing, rather than on every keystroke.

- **Why:** `SoukaiProduct` has `history: true`; saving on each keystroke would flood the CRDT operation log. Committing on `change` keeps the model live while persisting at natural boundaries; a final save on collapse guards against a value changed but not yet committed.
- **Alternative:** debounced save on `input`. Equivalent effect; `change`-based commit is simpler and maps to native field semantics.

### Decision 4: Field editors and the Preis slot
Render one editor per editable attribute, typed to the value: text inputs for strings (Weinart, Weinfarbe, Region, Land, Traubensorte, Klassifikation, Alkohol, Ausbau, Biologisch); number input for Flaschengrösse (ml); year number inputs for Jahrgang and Trinkfenster von/bis (converted to/from `Date` at Jan 1 of the year); number input for Preis. For **Preis**, edit mode renders an input bound to `product.getPrice()/setPrice()` instead of the slot (the slot's read view shows `bottle.getPrice()`, which already falls back to the product price, so the two stay consistent).

- **Why:** Matches the mockup (all detail fields, incl. price, become inputs). Year↔Date conversion keeps the domain in `Date` while presenting the year users think in.
- **Trade-off:** Preis differs between read (slot, parent-provided) and edit (product model). Acceptable because `bottle.getPrice()` resolves to the product price; documented as a known seam.

## Risks / Trade-offs

- **Save-per-keystroke history bloat** → persist on `change`/collapse, not `input` (Decision 3).
- **Preis read/edit seam** (slot vs product model) → acceptable since bottle price falls back to product price; noted for reviewers.
- **Year/Date coercion** (e.g. empty or non-numeric year) → guard: empty input clears the date; only a valid integer year sets it.
- **Editing the wrong product instance** → after `group-bottles-by-product-id`, each row is a single product id; the component edits exactly `this.product`, so the edited instance is the row's own product.
- **Concurrent Pod edits** → out of scope; handled by the existing sync CRDT/LWW like any other field write.
