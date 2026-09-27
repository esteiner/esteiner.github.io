## Why

On the cellar page, clicking a row's bottle count opens the rating dialog, which rates a bottle and moves it to Altglass. There is no way to record more bottles of a wine that is already in the cellar, e.g. after buying the same wine again outside the order flow. The dialog also leads with the generic word "Bewertung" and puts the wine name below it, although the wine is what the user is looking at. The target layout is sketched in `notes/ui/add-bottles.png`.

## What Changes

- **Rating dialog:** the title becomes the product name and the subtitle becomes "Bewertung", i.e. the two lines swap. The rating buttons and the "Abbrechen" / "Altglass" actions stay as they are.
- **New "+" button** in the rating dialog's upper right corner. It opens a second dialog for adjusting the number of bottles.
- **New bottle-count dialog:** the title is the product name. It has one row, "Anzahl Flaschen", with a number input prefilled with the row's current bottle count in this cellar, and the actions "Abbrechen" and "Aktualisieren".
- **"Aktualisieren"** with a higher number creates that many additional bottle entries for the same product in the current cellar, saves them, and refreshes the row count and the header count.
- The number can only be increased. Values below the current count are not accepted, and the same value changes nothing. Lowering the count would mean deleting bottles or moving them to Altglass, which is out of scope here.

## Capabilities

### New Capabilities
- `cellar-bottle-count-adjust`: The rating dialog's title layout, the "+" entry point, and the dialog that adds bottles of a product to a cellar.

### Modified Capabilities
<!-- none: bottle-rating and cellar-bottle-count-header specify storage and header behaviour, which are unchanged -->

## Impact

- `src/infrastructure/web/pages/cellar-page.ts`: rating dialog markup and styles, new count dialog, handlers.
- `src/application/KellermeisterService.ts`: new `addBottlesOfProduct(product, cellarId, count)`.
- `src/application/KellermeisterService.test.ts`: unit tests for the new method.
- `e2e/specs/`: new e2e test for adding bottles. `rating-on-bottle.spec.ts` keeps working because `.rating-product` still holds the product name.
- No schema or data-format changes. New bottles are ordinary bottle resources, the same as those created by order ingestion.
