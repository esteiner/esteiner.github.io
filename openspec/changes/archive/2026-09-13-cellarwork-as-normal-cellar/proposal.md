## Why

Every cellar opens to its bottle list; the user drills into actions from there. The well-known `cellarwork` cellar is the exception: clicking "Kellerarbeit" jumps straight to the specialized work display (the umbuchen/transfer grid), so the user can't just see what's in the cellar. It should behave like any other cellar — show the bottles first, and switch to the work display only on demand.

## What Changes

- Clicking the **Kellerarbeit** (cellarwork) cellar on the landing page opens the **normal cellar view** (its bottle list via `cellar-page`), like every other cellar — not the work display.
- The work display (`cellarwork-page`, the umbuchen/transfer grid) is reached from the cellar view's existing **"Kellerarbeit"** header button, exactly as normal cellars already offer it.
- Inbox auto-ingestion still runs when the cellarwork cellar is opened — including its **normal view** — so inbox orders continue to become bottles on open (ingestion is single-flight/idempotent, so running it from either view is safe).
- The footer **Hinzufügen** photo flow, after adding, lands on the **normal cellarwork view** (showing the newly added bottles) instead of the work display.

## Capabilities

### New Capabilities
- `cellarwork-cellar-view`: how the well-known cellarwork cellar is presented — its normal bottle view is shown first, and the work display is a drill-in from the "Kellerarbeit" action.

### Modified Capabilities
- `inbox-order-ingestion`: the "ingest on page open" trigger now fires when the cellarwork cellar is opened in its **normal view** as well as the work display (not only the dedicated work page).

## Impact

- **UI**: `landing-page` (`handleCellarClick`) routes the cellarwork cellar to `cellar-page`; `cellar-page` triggers inbox ingestion when it is showing the cellarwork cellar and keeps its "Kellerarbeit" button → `cellarwork-page`; `kellermeister-footer` navigates to the cellarwork cellar's `cellar-page` after a photo add. `cellarwork-page` stays as the work display (still reachable, still ingests).
- **Behavior**: `inbox-order-ingestion` trigger point widened to the cellarwork cellar's normal view.
- **Tests**: update `e2e/specs/photo-order-capture.spec.ts` (the flow now lands on `/cellar/…`, and "Kellerarbeit" opens the normal view); add coverage that opening the cellarwork cellar shows bottles and the work display is a drill-in.
