# Design

## Context

- Bottles are `SoukaiBottle` (soukai-bis) models, one Pod resource each, with `timestamps: true` (so `updatedAt` exists) and `history: true`. A rating is embedded in the bottle document with its own `date`.
- The only way a bottle enters Altglass is `KellermeisterService.disposeBottleToAltglass` (the rating dialog on the cellar page). Altglass is hidden from the Eingang transfer targets (`getAllVisibleCellars`), so `transferBottles` never moves into Altglass.
- Row ordering is done in `KellermeisterService.bottlesFromCellarGroupedByProduct`, which returns an insertion-ordered `Map<productId, Bottle[]>` that `cellar-page.ts` renders as-is.

## Goals / Non-Goals

**Goals:**
- Persist a reliable disposal timestamp for all future disposals.
- Give existing Altglass content a sensible order without a Pod migration.

**Non-Goals:**
- Showing the disposal date in the UI (can be added later on top of the field).
- Clearing the date when a bottle leaves Altglass — there is no "undo disposal" path today.
- Changing the order in the search page or in other cellars.

## Decisions

### New field `disposedAt` on the bottle, RDF `km:disposedAt`
Add `disposedAt: date().optional().rdfProperty("km:disposedAt")` to `SoukaiBottle.schema.ts`, and `getDisposedAt(): Date | undefined` / `setDisposedAt(date: Date): void` to the `Bottle` interface. The `km:` vocabulary is already used for `km:rating`; schema.org has no fitting "consumed at" property.

*Alternatives:*
- **Use `updatedAt` only** — changes on every later edit (e.g. re-rating, sync re-homing), so the order would drift. Kept only as last-resort fallback.
- **Use the rating date only** — missing when the user disposes without a rating.
- **Derive from soukai history** — expensive and engine-specific; overkill.

### Effective date computed in the model, ordering in the service
`SoukaiBottle` gets a domain method `getEffectiveDisposalDate(): Date | undefined` implementing `disposedAt ?? rating.getDate() ?? updatedAt` (the legacy numeric rating has no date and is skipped). Keeping the fallback chain next to the data mirrors how `getRating()` already handles legacy data. The service only compares dates.

### Ordering lives in `bottlesFromCellarGroupedByProduct`
After grouping, if `cellar.getId() === getAltglassId()`, sort by the row's max effective date (descending), then by the existing name comparator; rows without a date go last. Other cellars use the existing name sort unchanged. The page needs no change because it renders the map in order. Extract the two comparators into small private helpers so both branches stay readable.

### `disposeBottleToAltglass` sets the date
`bottle.setDisposedAt(new Date())` before the existing `save`. The date rides on the same bottle write as the cellar change and rating, so no extra request.

## Risks / Trade-offs

- [Legacy Altglass bottles without rating sort by `updatedAt`, which may reflect a later edit or a re-home during sync rather than the drinking moment] → Accepted; it only affects old data and self-corrects as soon as another bottle of that product is drunk.
- [Older app versions on another device save a bottle and drop the unknown `km:disposedAt` triple] → Low risk (single user, app updates via PWA); the fallback chain still yields a date.
- [Group sorting now needs dates for every bottle] → Pure in-memory work on already loaded bottles; negligible.

## Migration Plan

No data migration. The field is optional; deploy as usual. Rollback is safe — old versions ignore (or drop) the extra triple.
