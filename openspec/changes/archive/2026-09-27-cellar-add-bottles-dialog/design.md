## Context

`cellar-page.ts` renders the rating dialog inline when `ratingBottle` is set. Its markup is `.rating-title` ("Bewertung") followed by `.rating-product` (the product name), then four `.rating-button`s and the `.rating-action.cancel` / `.confirm` buttons. Each row passes `bottleGroup[0]` to `handleBottleClick`, and `bottleGroup.length` is the row count. Bottles are grouped by product id. `KellermeisterService.addBottles` (order ingestion) already creates bottles with `bottleFactory.createFromProduct(product)` + `setCellar(id)` + `bottleRepository.saveAll(...)`, and service writes reset `cachedBottles`. `cellar-page.loadBottles()` re-runs both the bottle-list and the header-count tasks. The e2e tests address the dialog through `.rating-product`, `.rating-button` and `.rating-action.confirm`.

## Goals / Non-Goals

**Goals:**
- Match `notes/ui/add-bottles.png`: product name as the title, "Bewertung" as the subtitle, "+" top right, and a second dialog with "Anzahl Flaschen" plus "Abbrechen" / "Aktualisieren".
- Add bottles of an existing product to the current cellar and persist them.

**Non-Goals:**
- Lowering the count (deleting bottles, or moving them to Altglass in bulk).
- Adding bottles on other pages (search, cellarwork, order).
- Setting a price, order link or rating on the new bottles. They carry only product and cellar, like ingested bottles.
- Extracting the dialogs into reusable components.

## Decisions

- **Swap the order of the two lines, keep the class names.** `.rating-product` (the product name) moves above `.rating-title` ("Bewertung"). The styles change so that the product name is the prominent 18px/600 title and "Bewertung" is the muted 14px subtitle. Alternative: rename the classes to match their new role. Rejected because the e2e tests select `.rating-product`, and the name still describes the content.
- **Second dialog as page state, not a new component.** Add `countBottle?: Bottle`, `countCurrent: number` and `countValue: string` states, and render a second overlay reusing the `.rating-overlay` / `.rating-container` / `.rating-action` styles. This matches how the rating dialog is built today. `handleBottleClick` also receives the group's length, so the current count is known without recounting. Alternative: a new Lit component. Rejected because it would be the only extracted dialog on the page and would need events for every action.
- **"+" button** is a plain `<button class="rating-add">` with the `plus.svg` icon, the same pattern as the pencil button in `bottle-component`. It is positioned absolutely in the top-right of `.rating-container` (which becomes `position: relative`), with `aria-label="Flaschen hinzufügen"`. Alternative: `kellermeister-button icon="plus"`. Rejected during implementation because that component only derives an accessible name from visible text, so an icon-only instance would be unlabelled for screen readers.
- **Service method `addBottlesOfProduct(product: Product, cellarId: string, count: number): Promise<void>`**. It creates `count` bottles through `bottleFactory.createFromProduct`, calls `setCellar(cellarId)`, `saveAll`, and resets `cachedBottles`. `count <= 0` is a no-op. Alternative: reuse `addBottles(order, …)`. Rejected because that path creates a new order and a new product. Here the existing product must be reused so the row stays grouped by product id.
- **Validation in the page.** Parse the input with `Number`, and enable "Aktualisieren" only for integers `> countCurrent`. Use `<input type="number" min="{current}" step="1" inputmode="numeric">`. The service guards against `count <= 0` as a second line of defence.
- **Flow.** "+" closes the rating dialog and opens the count dialog. "Abbrechen" closes the dialog and returns directly to the cellar view, not to the rating dialog. "Aktualisieren" awaits the service call, closes the dialog and calls `loadBottles()`.

## Risks / Trade-offs

- [Accidental large numbers (e.g. 50 instead of 5) create many bottles at once] → There is no removal path in this change. Such bottles can be moved to Altglass one at a time. A confirmation step for large differences was considered, but it is not in the mockup and was not added.
- [The row count comes from the current (possibly filtered) list] → Bottles are grouped per product within the cellar, and filters only hide whole rows, never some bottles of a row. So `bottleGroup.length` is the product's count in this cellar.
- [Many bottles are written in one `saveAll`] → Same mechanism as order ingestion, which already writes whole order quantities.
