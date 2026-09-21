## Why

Product details shown in the cellar view are read-only today: if a wine's data (region, grape, drinking window, price, …) is wrong or incomplete, there is no way to correct it in the app. Users need to fix product details in place, where they already look at them.

## What Changes

- In the cellar bottle view, when a product row is **expanded** (by clicking its header/name), a **pencil button** (`pencil.svg`) appears in the header, aligned to the right.
- Clicking the pencil toggles **edit mode**: the product detail fields switch from read-only labels to **input fields**.
- Editing an input **instantly writes the change to the product model** and persists it, so corrections survive collapse, navigation, and sync.
- Clicking the header again **collapses** the row (and leaves edit mode).
- Editable fields are the product's own attributes (Jahrgang, Flaschengrösse, Weinart, Weinfarbe, Region, Land, Traubensorte, Klassifikation, Alkohol, Ausbau, Biologisch, Trinkfenster von/bis, Preis). **Quelle** (derived from the order) and **Bewertungen** (aggregated ratings) stay read-only.
- Editing is available only in the cellar bottle view (`bottle-component`), not in the order view's product display.

The flow matches `notes/ui/edit-product-in-cellar.jpg`.

## Capabilities

### New Capabilities
- `product-inline-edit`: Inline editing of a product's detail fields from the expanded product row in the cellar view — pencil toggles edit mode, changes write through to the model and persist.

### Modified Capabilities
<!-- No existing spec covers product detail display/editing; introduced as a new capability. -->

## Impact

- **Domain** (`src/domain/Product/Product.ts`): add setters for the editable attributes (currently getter-only).
- **Infrastructure — Soukai** (`src/infrastructure/soukai/model/SoukaiProduct.ts`): implement the setters against the mapped RDF fields.
- **Application** (`src/application/KellermeisterService.ts`): add `updateProduct(product)` to persist edits via `ProductRepository.save`.
- **Web** (`src/infrastructure/web/components/`): `bottle-component` gains the pencil button + `editing` state and passes it to `product-component`; `product-component` renders inputs (bound to the setters) when editing and persists changes via `CDI` → `KellermeisterService.updateProduct`.
- **Assets:** uses the existing `src/infrastructure/web/images/icons/pencil.svg`.
