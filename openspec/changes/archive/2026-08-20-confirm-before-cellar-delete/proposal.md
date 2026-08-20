## Why

Deleting a cellar from the profile page happens immediately on the first click of the delete button, with no chance to reconsider. Deletion is destructive, so the user should confirm before an (empty) cellar is removed. And when the cellar still contains bottles, the app used to silently navigate away — the user should instead be told why the cellar cannot be deleted.

## What Changes

- Before an empty cellar is deleted from the profile page, ask the user to confirm via a styled dialog (in analogy to the WebID dialog). Only proceed with the deletion when the user confirms; if they cancel, nothing is deleted and the list is unchanged.
- When the delete action is used on a cellar that still contains bottles, show a styled informational dialog explaining that a cellar with bottles cannot be deleted, offering to navigate to the cellar (to empty it) or to dismiss. It replaces the previous silent auto-navigation.

## Capabilities

### New Capabilities
<!-- None; this refines the existing profile-overview capability. -->

### Modified Capabilities
- `profile-overview`: The "delete a cellar" behavior now (a) requires confirmation before an empty cellar is removed, and (b) shows an informational dialog (instead of silently navigating) when the cellar still contains bottles.

## Impact

- `src/infrastructure/web/pages/profile-page.ts` — in `handleDeleteCellarClick`, open a styled confirmation dialog for empty cellars and a styled informational dialog for non-empty cellars; both reuse the WebID dialog's markup/CSS. Adds `cellarToDelete`/`cellarWithBottles` state and the corresponding confirm/cancel/navigate/close handlers.
- No application/domain changes; UI-only. No data migration.
