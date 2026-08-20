## Why

On the profile page, each cellar's delete button uses the `ghost` variant, which draws a bordered white circle. The delete controls should look cleaner (no border) and sit directly next to their cellar name rather than floated to the far edge of the row.

## What Changes

- Remove the border from the cellar delete buttons on the profile page (drop the `ghost` variant so the trash icon renders borderless; it keeps its green colour).
- Lay the cellar names and delete buttons out in a shared grid so the buttons sit close to the names (right after them, not the far right) and line up in a single vertical column.

## Capabilities

### New Capabilities
<!-- None; this refines the existing profile-overview capability. -->

### Modified Capabilities
- `profile-overview`: Adds a presentation requirement for the cellar delete controls — they are shown without a border and aligned vertically in the list.

## Impact

- `src/infrastructure/web/pages/profile-page.ts` — remove `ghost` from the delete `kellermeister-button`; render the cellar names and buttons in a `.cellar-list` grid (`grid-template-columns: max-content max-content`) so names share one column and buttons align in the next, right after the names.
- Purely presentational; no behavioral, application, or domain changes. No data migration.
