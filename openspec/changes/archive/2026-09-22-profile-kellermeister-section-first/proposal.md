## Why

The profile page opens with "Solid Profil" — eight rows of WebID, storage, index and session URLs that a user reads once while setting up and rarely again. The "Kellermeister" section below it holds what the user actually comes to this page for: their cellars, the add/delete cellar actions, the bottle total, and the app version. Putting it first means the page opens on the useful part instead of on plumbing.

## What Changes

- On the profile page, the **"Kellermeister" section moves to the first position**, above "Solid Profil".
- The remaining sections keep their current relative order, so the page reads: **Kellermeister → Solid Profil → Solid Apps → Debug**.
- Nothing inside any section changes — same rows, same contents, same actions, same styling.
- The page is renamed from "Profil" to **"Kellerprofil"**, in both its header title and the footer action that opens it. The "Solid Profil" section keeps its name.

## Capabilities

### New Capabilities
<!-- None. This is a presentation change to an existing capability. -->

### Modified Capabilities
- `profile-overview`: gains a requirement fixing the order of the profile page's sections, with "Kellermeister" first, and a requirement naming the page "Kellerprofil" in both its title and the footer action. The existing requirements (cellar list, add, delete, delete-control styling, inbox upload) are unchanged.

## Impact

- `src/infrastructure/web/pages/profile-page.ts` — the `render()` template only: the "Kellermeister" `section-header` + `card` pair moves above the "Solid Profil" pair, and the header title becomes "Kellerprofil".
- `src/infrastructure/web/components/kellermeister-footer.ts` — the profile button's `text` becomes "Kellerprofil".
- No change to state, data loading, services, domain, or styling. No new dependencies.
- `e2e/specs/` had no profile spec before this change; the one added here asserts both the order and the labels.
