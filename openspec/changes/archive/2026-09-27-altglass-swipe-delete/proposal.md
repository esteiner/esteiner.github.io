## Why

Bottles that have been drunk are moved to the Altglass cellar, and they stay there forever. Over time Altglass fills up with wines the user no longer cares about, and the app offers no way to clear them out. Mobile users expect the familiar "swipe left to reveal delete" gesture for removing list entries.

## What Changes

- In the **Altglass** cellar only, swiping a product row to the left reveals a delete icon at the row's right edge.
- Tapping the icon immediately deletes **all** bottles of that product in Altglass. There is no confirmation dialog. The row disappears and the header count drops by the row's bottle count.
- Swiping right, tapping elsewhere, or starting a swipe on another row closes an open row without deleting.
- In every other cellar (and on other pages) rows cannot be swiped and show no delete icon.
- The deletion is persisted locally and synchronized to the Pod like any other deletion (as tombstones).
- **BREAKING** (data): ratings stored on the deleted bottles are deleted with them. If bottles of the same product remain in other cellars, their product detail view no longer lists those ratings. Ratings in the product's legacy rating list are unaffected.
- The product resource itself is kept, since other bottles and order items may still reference it.

## Capabilities

### New Capabilities
- `altglass-swipe-delete`: The swipe-to-delete gesture on the Altglass cellar page, and the deletion of a product's Altglass bottles.

### Modified Capabilities
<!-- none -->

## Impact

- `src/application/KellermeisterService.ts`: new `deleteBottlesFromAltglass(bottles)`, which refuses bottles that are not in Altglass.
- `src/infrastructure/web/components/swipe-row.ts` (new): a Lit wrapper component that handles the gesture and reveals the delete button.
- `src/infrastructure/web/pages/cellar-page.ts`: wraps rows in `swipe-row` only when the cellar is Altglass, and handles the delete.
- Unit tests for the service method, and an e2e test for the gesture in Altglass and its absence elsewhere.
- No schema changes. `BottleRepository.delete` already exists.
