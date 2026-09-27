## 1. Service

- [x] 1.1 Add `deleteBottlesFromAltglass(bottles)` to `KellermeisterService`: throw if any bottle is not in Altglass (and delete nothing), otherwise call `bottleRepository.delete` for each bottle and reset `cachedBottles`
- [x] 1.2 Add unit tests: deletes all given Altglass bottles; throws and deletes nothing for a mix that includes a non-Altglass bottle; the cache is invalidated

## 2. swipe-row component

- [x] 2.1 Create `src/infrastructure/web/components/swipe-row.ts`: a content layer (default slot) over a right-aligned delete button (`trash.svg`, `aria-label="Löschen"`), with `touch-action: pan-y`
- [x] 2.2 Implement the pointer gesture: direction lock after about 10px, follow the finger clamped between −72px and 0, open past half the width and snap back otherwise, and swipe right to close
- [x] 2.3 Suppress the click that follows a horizontal drag. A tap on the content of an open row closes it and is swallowed
- [x] 2.4 Dispatch `swipe-open` when opened and `swipe-delete` when the button is tapped. Expose `close()`

## 3. Cellar page

- [x] 3.1 Compute `isAltglass`, and only then wrap each row's `bottle-component` in `<swipe-row>`. Leave the markup unchanged for other cellars
- [x] 3.2 Keep a single open row: on `swipe-open`, close the previously open row. While a row is open, a tap outside it closes it
- [x] 3.3 On `swipe-delete`, call `deleteBottlesFromAltglass(group)` and then `loadBottles()`

## 4. Tests and verification

- [x] 4.1 Add an e2e test: in Altglass, a mouse swipe on a row reveals "Löschen", and tapping it removes the row and lowers the header count by the row count, which still holds after a reload. A short swipe snaps back. In another cellar, a swipe reveals no delete button
- [x] 4.2 Run `npx tsc --noEmit` and `npm test`, and confirm both pass
- [x] 4.3 Run the new e2e spec together with `cellar-bottle-count` and `group-by-product-id` (which also uses Altglass), and confirm they pass
