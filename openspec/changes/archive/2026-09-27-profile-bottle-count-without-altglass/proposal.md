## Why

The "Flaschen" row in the profile page's Kellermeister section shows `getAllBottles().length`. That count includes the bottles in the Altglass cellar, i.e. bottles that have already been drunk. The number people want is how many bottles they still have.

## What Changes

- The "Flaschen" row shows the number of bottles in all cellars **except** Altglass.
- "All cellars except Altglass" includes the well-known Kellerarbeit (cellarwork) cellar and any bottle without a cellar. Only bottles whose cellar is the Altglass cellar are left out.
- A new `KellermeisterService.countBottles()` returns that number, so the rule is tested and not computed in the page.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `profile-overview`: adds a requirement that the bottle total in the Kellermeister section leaves out Altglass.

## Impact

- `src/application/KellermeisterService.ts`: new method `countBottles(): Promise<number>`.
- `src/infrastructure/web/pages/profile-page.ts`: uses `countBottles()` instead of `getAllBottles().length`.
- `src/application/KellermeisterService.test.ts`: unit tests for the count.
- `e2e/specs/profile-bottle-count.spec.ts`: read-only check of the row.
- No data or routing changes.
