## 1. Filter logic

- [x] 1.1 Add `Rotwein`, `Weisswein`, `Rosewein` to `Weinart` (done in the refactor)
- [x] 1.2 Require the matching still-wine Weinart in each colour branch of `filterProduct` (done in the refactor, with a `!isSprudel` guard)
- [x] 1.3 Change the guard to "no Weinart filter active" (`!(isSprudel || isDessert)`)
- [x] 1.4 Remove the commented-out `!isSprudel` block in `filterProduct`

## 2. Tests

- [x] 2.1 Add `ProductFilter.test.ts` tests for colour-only filters: Weiss/Rot/Rosé match their still wine type and reject `Schaumwein`, `Wein` and `Dessertwein` of the same colour. A missing Weinart still matches
- [x] 2.2 Add tests for Sprudel + colour (only `Schaumwein` of that colour) and Dessert + Weiss (only `Dessertwein` / `weiss`)
- [x] 2.3 Check that the existing tests still express the intended behaviour, and update any that assumed a colour filter ignores Weinart
- [x] 2.4 Run `npx tsc --noEmit` and `npm test`, and confirm both pass
