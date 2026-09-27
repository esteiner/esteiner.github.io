## Context

`cellar-page` renders each product group as `<li><bottle-component>…<button class="bottle-button" slot="count">N</button></bottle-component></li>` inside `.bottles` (which has `overflow: hidden` and rounded corners). The groups come from `bottlesFromCellarGroupedByProduct(cellar, filter)`, as a `Map<productId, Bottle[]>`. The Altglass cellar is identified by `service.getAltglassId()`. `BottleRepository.delete(bottle)` deletes one bottle in the local engine, and soukai-bis `Sync` propagates deletions to the Pod as tombstones (covered by `local-first.test.ts`). Service writes reset `cachedBottles`, and `cellar-page.loadBottles()` re-runs the list and header-count tasks. There is no gesture handling anywhere in the app yet.

## Goals / Non-Goals

**Goals:**
- A native-feeling swipe-left-to-delete on Altglass rows, for touch and mouse.
- Deletion of all of a product's Altglass bottles, persisted and synced.
- Enforce "Altglass only" in both the UI and the application layer.

**Non-Goals:**
- A confirmation dialog or undo, which the user explicitly declined.
- Keeping ratings by copying them onto the product. The user chose to delete them with the bottles.
- Deleting products or order items, or cleaning up products that end up without any bottles.
- Swipe actions in other cellars or on other pages. A keyboard-only alternative for deletion is also out of scope.

## Decisions

- **New `swipe-row` component** wraps the row content in a default slot, with a delete button absolutely positioned behind it on the right. The content layer is translated with `transform: translateX(...)`. It dispatches a bubbling `swipe-delete` event when the button is tapped, and a `swipe-open` event when a row opens. Alternative: gesture code directly in `cellar-page`. Rejected because the pointer state machine would get tangled with the page's many handlers. A component can also be reused later.
- **Pointer Events with `touch-action: pan-y`** on the content layer. This handles touch and mouse with one code path, and leaves vertical scrolling to the browser. Direction lock: after about 10px of movement, if |dx| > |dy| the gesture is horizontal and the row follows the finger (clamped between −72px and 0, the button width), otherwise it is ignored. On release, the row opens if it has been pulled past half the button width, and snaps closed otherwise. Alternative: touch events. Rejected because they don't cover mouse, and the e2e tests drive the mouse.
- **Suppress the click after a drag.** If the pointer moved horizontally, the `click` that follows `pointerup` is swallowed in the capture phase. This way a swipe doesn't also expand the product or open the rating dialog.
- **One open row.** `cellar-page` tracks the currently open `swipe-row` through the `swipe-open` event and closes the previous one. A tap on the open row's content (outside the button) closes it and is swallowed. A tap outside any row is handled by a document-level listener registered while a row is open, which closes the row.
- **Altglass check in the page**: `isAltglass = cellar.getId() === service.getAltglassId()`. Only then are rows wrapped in `<swipe-row>`, otherwise the markup is exactly as today. The delete button uses `trash.svg` with `aria-label="Löschen"`, on a red background (`#B3261E`).
- **Service `deleteBottlesFromAltglass(bottles: Bottle[]): Promise<void>`.** If any bottle's `getCellar()` differs from `getAltglassId()`, it throws before deleting anything. Otherwise it calls `bottleRepository.delete` for each bottle and resets `cachedBottles`. It deletes one by one because the repository has no batch delete, and adding one isn't needed for rows of a few bottles. Alternative: pass only the product and let the service find its Altglass bottles. Rejected because the page already has the exact group, and the explicit list keeps the guard simple.
- **After deleting**, `cellar-page` awaits the service call and then calls `loadBottles()`, which refreshes the rows and the header count.

## Risks / Trade-offs

- [Accidental deletion: no confirmation and no undo] → This is the user's explicit choice. The icon only appears after a deliberate swipe past the threshold, and only in Altglass, where bottles have already been drunk.
- [Ratings are lost with the bottles] → This is the user's explicit choice. It only affects ratings on bottles, not legacy product ratings.
- [The gesture could conflict with the row's existing clicks (expand, rating dialog)] → The click after a drag is suppressed, and taps on an open row only close it.
- [No keyboard or screen-reader way to delete] → The revealed button itself is a real, labelled button. Revealing it by keyboard is out of scope.
