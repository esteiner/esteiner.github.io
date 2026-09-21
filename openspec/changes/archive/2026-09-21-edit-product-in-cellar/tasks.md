## 1. Domain layer

- [x] 1.1 Add setters to the `Product` interface (`src/domain/Product/Product.ts`) for the editable attributes: `setProductionDate(Date | undefined)`, `setVolumeMl(number)`, `setWineType(string)`, `setWineColor(string)`, `setRegion(string)`, `setCountry(string)`, `setGrapeVariety(string)`, `setClassification(string)`, `setAlcoholContent(string)`, `setProduction(string)`, `setOrganic(string)`, `setDrinkingWindowFrom(Date | undefined)`, `setDrinkingWindowTo(Date | undefined)`, `setPrice(number)`.

## 2. Persistence layer (Soukai)

- [x] 2.1 Implement the new setters in `SoukaiProduct` (`src/infrastructure/soukai/model/SoukaiProduct.ts`), assigning the mapped schema fields (`productionDate`, `milliliter`, `weinart`, `weinfarbe`, `region`, `land`, `traubensorte`, `klassifikation`, `alkoholgehalt`, `ausbau`, `biologisch`, `trinkfensterVon`, `trinkfensterBis`, `price`).

## 3. Application layer

- [x] 3.1 Add `updateProduct(product: Product): Promise<void>` to `KellermeisterService` that persists via `productRepository.save(product)` (no cache invalidation — the rendered instance is edited in place).

## 4. Web / display — bottle-component (header + edit toggle)

- [x] 4.1 Add an `editing` state to `bottle-component` and, when `expanded`, render a pencil button (inline `pencil.svg?raw`) in the header, right-aligned.
- [x] 4.2 Pencil click: `stopPropagation()` + toggle `editing` (does not collapse). Header click: toggle `expanded` and set `editing = false` when collapsing.
- [x] 4.3 Pass `.editing=${this.editing}` to `product-component`.

## 5. Web / display — product-component (fields ↔ inputs, write-through)

- [x] 5.1 Add an `editing` property (default `false`) to `product-component`.
- [x] 5.2 For each editable field, render an input when `editing` else the current label; keep Quelle and Bewertungen as read-only labels in both modes.
- [x] 5.3 On input `input`, call the matching setter on `this.product` (instant write to the model). Convert year inputs (Jahrgang, Trinkfenster von/bis) to/from `Date` (Jan 1 of the year); guard empty/invalid years. Bind Preis to `getPrice()/setPrice()` in edit mode (replacing the slot).
- [x] 5.4 On input `change` (commit/blur), persist via `CDI.getInstance().getKellermeisterService().updateProduct(this.product)`; also persist when leaving edit mode / on collapse.

## 7. Hersteller / Weinname + derived name

- [x] 7.1 Add `setName`, `setProducer`, `setWineName` to the `Product` interface and implement them in `SoukaiProduct` (mapped to `name`, `hersteller`, `weinname`).
- [x] 7.2 In `product-component`, show **Hersteller** and **Weinname** as detail fields directly below Preis, editable like the other text fields.
- [x] 7.3 When Hersteller, Weinname, or Jahrgang is edited, recompute `name` = `[Hersteller, Weinname, year].filter(non-empty).join(' ')` and persist it with the other edits.
- [x] 7.4 Notify the header so it re-renders the recomputed name (`product-component` dispatches an event; `bottle-component` re-renders on it).

## 6. Verification

- [x] 6.1 Add a unit test for `SoukaiProduct` setters and `KellermeisterService.updateProduct` (a set-then-save round-trips the value).
- [x] 6.2 Manually verify in the running app against `notes/ui/edit-product-in-cellar.jpg`: expand a product → pencil appears right-aligned → click pencil → fields become inputs → edit a field (e.g. Region) → collapse and re-expand → edited value persists; Quelle/Bewertungen stay read-only; the order view shows no pencil.
