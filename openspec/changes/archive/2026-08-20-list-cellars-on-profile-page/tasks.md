## 1. Load cellars into profile page state

- [x] 1.1 Add `@state() private cellars: Cellar[] = []` to `profile-page.ts` (import the `Cellar` domain type).
- [x] 1.2 In `fetchUserProfile()` (or a small `loadCellars()` called from `connectedCallback`), populate `this.cellars` from `this.cdi.getKellermeisterService().getAllCellars()`, alongside the existing bottle-count load.
- [x] 1.3 Filter out cellars with a negative `displayOrder` (guard `!(getDisplayOrder() < 0)`, so `undefined`/`0` stay visible) before assigning to `this.cellars`.

## 2. Render the cellar names in the Keller group

- [x] 2.1 In the `Keller` `.group` (profile-page.ts around lines 109-111), render a `.value` cell listing `this.cellars.map(c => c.getName())` (one per line via nested `<div>`), using the existing `.value` styling.
- [x] 2.2 Show a neutral placeholder ("Keine Keller") while the list is empty/not yet loaded, so the group never renders blank or broken.

## 3. Add-cellar action

- [x] 3.1 Extract cellar loading into a reusable `loadCellars()` method and call it from `fetchUserProfile()`.
- [x] 3.2 Add a `kellermeister-button` (icon `plus`, `ghost`, `size="small"`) on the right side of the "Keller" group; extend that group's grid to `110px 1fr auto` via a `.group-keller` modifier and center the button.
- [x] 3.3 Add `handleNewCellarClick`: `prompt` for a name, call `createCellar(name)`, then `loadCellars()` to refresh the list.

## 4. Delete-or-navigate per cellar

- [x] 4.1 Add a public `isCellarEmpty(cellar): Promise<boolean>` to `KellermeisterService` (thin wrapper over the existing private `isEmpty`).
- [x] 4.2 Render a delete `kellermeister-button` (icon `trash`) behind each cellar name in the "Keller" list (a `.cellar-row` flex row: name + button).
- [x] 4.3 Add `handleDeleteCellarClick(cellar)`: if `isCellarEmpty` → `removeCellar(cellar)` then `loadCellars()`; else `Router.go` to the `cellar-page` route for that cellar id (import `Router` + `router`).

## 5. Verification

- [x] 5.1 Typecheck (`tsc --noEmit`) passes and the full test suite passes (116 tests, 12 files).
- [x] 5.2 Manual verify (best-effort): tsc + tests confirm the profile-page wiring compiles and the app is unaffected. The visual check of the "Keller" group (cellar list + right-aligned add-cellar button) needs the running app (and a logged-in session for the rest of the profile page); the cellar list and creation are local-first via `getAllCellars()`/`createCellar()`.
