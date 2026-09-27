## 1. Service

- [x] 1.1 Add `addBottlesOfProduct(product, cellarId, count)` to `KellermeisterService`: create `count` bottles via `bottleFactory.createFromProduct`, `setCellar(cellarId)`, `bottleRepository.saveAll`, and reset `cachedBottles`. `count <= 0` is a no-op
- [x] 1.2 Add unit tests in `KellermeisterService.test.ts`: creates and saves N bottles with the given product and cellar; no-op for 0 and negative values; the cache is invalidated

## 2. Rating dialog

- [x] 2.1 Swap the lines in the rating dialog: `.rating-product` (the product name) first as the title, then `.rating-title` ("Bewertung") as the subtitle, and swap their styles
- [x] 2.2 Add the "+" button (plain `<button class="rating-add">` with `plus.svg`, `aria-label="Flaschen hinzufügen"`) in the upper right of `.rating-container`
- [x] 2.3 Pass the group length from the row to `handleBottleClick` and keep it as the current count

## 3. Bottle-count dialog

- [x] 3.1 Add states and render the count dialog: product name as the title, the "Anzahl Flaschen" label with a number input prefilled with the current count, and "Abbrechen" / "Aktualisieren"
- [x] 3.2 Enable "Aktualisieren" only for whole numbers greater than the current count
- [x] 3.3 "Abbrechen" closes the dialog and returns directly to the cellar view. "Aktualisieren" calls `addBottlesOfProduct(product, cellarId, value - current)`, closes the dialog and calls `loadBottles()`

## 4. Tests and verification

- [x] 4.1 Add an e2e test: open the rating dialog, check the title is the product name and the subtitle is "Bewertung", open "+", check the prefilled count, check that "Aktualisieren" is disabled for the same and lower values, increase by 2, check the row count and header count, then reload and check again
- [x] 4.2 Run `npx tsc --noEmit` and `npm test`, and confirm both pass
- [x] 4.3 Run the e2e specs `rating-on-bottle`, `cellar-bottle-count` and the new one, and confirm they pass
