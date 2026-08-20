## Why

The profile page's "Keller" (cellars) row under the Kellermeister card is a dead label: it shows the heading but no data. Users can't see, from their profile, which cellars exist. Listing the existing cellars there gives an at-a-glance overview alongside the bottle count.

## What Changes

- Populate the "Keller" group on the profile page with the names of existing cellars (via `KellermeisterService.getAllCellars()`), excluding cellars with a negative `displayOrder`, rendered as the group's value.
- Load the cellars when the profile page loads (alongside the existing bottle-count fetch) and hold them in component state.
- Render an empty/placeholder value gracefully while loading or when there are no cellars.
- Add an add-cellar action (a `kellermeister-button`) on the right side of the "Keller" group that prompts for a name, creates the cellar, and refreshes the list.
- Add a delete action behind each cellar name: delete the cellar when it holds no bottles (and refresh the list), or navigate to the cellar's page when it still contains bottles.

## Capabilities

### New Capabilities
- `profile-overview`: The profile page presents an overview of the user's Kellermeister data — including the list of existing cellars.

### Modified Capabilities
<!-- None. -->

## Impact

- `src/infrastructure/web/pages/profile-page.ts` — add a `loadCellars()` loader and a `@state()` list of cellars, render their names inside the existing `Keller` `.group`, and add a `kellermeister-button` + `handleNewCellarClick` on the right of that group.
- Uses `KellermeisterService.getAllCellars()` (read), `createCellar()`, and `removeCellar()` (already existing); adds a small public `isCellarEmpty()` wrapper over the existing private `isEmpty`.
- Navigation reuses the `cellar-page` route (Vaadin Router), as on the landing page.
- No data migration; UI-only.
