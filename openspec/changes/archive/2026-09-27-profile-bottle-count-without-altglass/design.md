## Context

`profile-page.fetchUserProfile()` set `numberOfBottles = (await service.getAllBottles()).length` and rendered it in the "Flaschen" row. `getAllBottles()` is cached and local-first. The Altglass cellar is a well-known cellar with id `service.getAltglassId()`. A bottle's cellar is `bottle.getCellar()`, which holds the cellar id, the same id that `landing-page` compares against `getAltglassId()`.

## Goals / Non-Goals

**Goals:**
- Show the number of bottles not in Altglass.
- Keep the counting rule in the application layer, where it is unit-tested.

**Non-Goals:**
- Showing the total including Altglass as well. This was tried as `N (M)` and dropped as not needed.
- Excluding Kellerarbeit from the count.
- Per-cellar counts on the profile page.
- Changing the cellar-page header count (`cellar-bottle-count-header`).

## Decisions

- **New service method `countBottles(): Promise<number>`**, computed from `getAllBottles()` by keeping bottles whose `getCellar()` differs from `getAltglassId()`. Alternative: filter in `profile-page`. Rejected because the page would own a domain rule, and there is no unit-test setup for pages.
- **Page keeps `numberOfBottles`** and only swaps where the value comes from. Rendering is unchanged, and the row stays empty until the count loads.
- **Label stays "Flaschen".**

## Risks / Trade-offs

- [`getAllBottles()` is cached, so the count reflects the cache at page load] → Same as the previous count, so this is not a regression.
