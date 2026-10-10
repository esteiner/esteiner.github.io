# Tasks

## 1. Disposal date on the bottle

- [x] 1.1 Add `getDisposedAt(): Date | undefined`, `setDisposedAt(date: Date): void` and `getEffectiveDisposalDate(): Date | undefined` to the `Bottle` interface (`src/domain/Bottle/Bottle.ts`); verify `npx tsc --noEmit` reports only the not-yet-implemented members in `SoukaiBottle` and test stubs
- [x] 1.2 Add `disposedAt: date().optional().rdfProperty("km:disposedAt")` to `SoukaiBottle.schema.ts` and implement the three methods in `SoukaiBottle.ts` (fallback chain `disposedAt` → rating date → `updatedAt`, skipping the dateless legacy rating); update bottle stubs in existing tests so `npx tsc --noEmit` passes
- [x] 1.3 Extend `SoukaiBottle.test.ts`: disposal date round-trips through save/load, a bottle without the field loads with `getDisposedAt()` undefined, and the effective-date fallback order (stored → rating date → updatedAt) holds; verify with `npm test`

## 2. Record the date on disposal

- [x] 2.1 In `KellermeisterService.disposeBottleToAltglass`, call `bottle.setDisposedAt(new Date())` before saving; verify by extending `DisposeBottleRating.test.ts` so both the "with rating" and "without rating" cases assert a disposal date close to now after reload (`npm test`)

## 3. Altglass ordering

- [x] 3.1 In `bottlesFromCellarGroupedByProduct`, when the cellar is Altglass sort rows by their latest effective disposal date (newest first), ties and undated rows by case-insensitive name with undated rows last; keep the name sort for other cellars; extract the comparators into private helpers
- [x] 3.2 Add a `describe('bottlesFromCellarGroupedByProduct')` block in `KellermeisterService.test.ts` covering: newest-first, row date = latest bottle, equal-date tie by name, undated rows last, filter keeps order, and a non-Altglass cellar still sorted by name; verify with `npm test`

## 4. Integration check

- [x] 4.1 Run `npm run build` and `npm test`; both succeed
- [x] 4.2 Manually (or via `npm run dev` + browser): drink a bottle of a product listed lower in Altglass and confirm its row moves to the top, and that the order is unchanged after a reload
