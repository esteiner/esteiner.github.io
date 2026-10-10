# Proposal

## Why

The Altglass cellar collects every bottle that has been drunk, and it keeps growing. Today its rows are sorted alphabetically like every other cellar, so the wines drunk most recently (the ones you want to look up, rate or talk about) are buried somewhere in the list. Bottles do not record when they were drunk, so the app cannot order by it.

## What Changes

- Add an optional **disposal date** to the bottle ("getrunken am"): the moment the bottle was moved to Altglass. It is persisted in the bottle's Pod resource as a new RDF property and synchronised like the other bottle fields.
- `disposeBottleToAltglass` sets the disposal date to "now" on every disposal (with or without a rating).
- For bottles already in Altglass without a disposal date (legacy data), an **effective** disposal date is derived: the date of the bottle's rating if present, otherwise the bottle's last-modified timestamp (`updatedAt`). No data migration is written to the Pod.
- On the **Altglass** cellar page, product rows are ordered by the most recent effective disposal date among their bottles, newest first. Rows with the same date, and rows with no date at all, fall back to the existing case-insensitive name order (undated rows at the end).
- All other cellars keep the existing alphabetical ordering.

## Capabilities

### New Capabilities
- `bottle-disposal-date`: Bottles record when they were moved to Altglass; defines when the date is set and how an effective date is derived for legacy bottles.

### Modified Capabilities
- `cellar-bottle-grouping`: The "Rows remain ordered by product name" requirement gets an exception for the Altglass cellar, whose rows are ordered by most recent disposal date.

## Impact

- `src/domain/Bottle/Bottle.ts` — new `getDisposedAt()` / `setDisposedAt()` (or equivalent) on the `Bottle` interface.
- `src/infrastructure/soukai/model/SoukaiBottle.schema.ts` / `SoukaiBottle.ts` — new optional date field (`km:disposedAt`), accessor implementation with the legacy fallback.
- `src/application/KellermeisterService.ts` — `disposeBottleToAltglass` sets the date; `bottlesFromCellarGroupedByProduct` orders Altglass rows by date.
- Existing bottle resources stay readable (field is optional); older app versions ignore the extra triple.
- Tests: service and model unit tests for the new ordering and date handling.
