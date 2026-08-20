## Context

The profile page's `handleDeleteCellarClick(cellar)` currently branches on emptiness: an empty cellar is deleted immediately (`removeCellar` + `loadCellars`), a non-empty cellar navigates to its cellar page. The delete happens on the first click with no confirmation. The app already uses native `prompt(...)` for adding a cellar and `confirm`-style flows elsewhere are absent, so a native `confirm(...)` is the consistent, lightweight choice.

## Goals / Non-Goals

**Goals:**
- Require an explicit user confirmation before an empty cellar is deleted.
- Cancelling leaves the cellar and the list untouched.

**Non-Goals:**
- Confirming the non-empty branch (it only navigates, nothing destructive).
- Building a custom confirmation dialog/component — reuse the native `confirm`, matching the existing `prompt` UX.
- Undo/soft-delete UX beyond the existing behavior.

## Decisions

### Decision 1: Confirm only in the empty-cellar (delete) branch, via a styled in-page dialog
In `handleDeleteCellarClick`, when the cellar is empty, open a styled confirmation dialog (rather than a native `confirm`); proceed with `removeCellar` + `loadCellars` only when the user confirms. The emptiness check stays first, so the non-empty branch still navigates without a dialog.

- **Dialog implementation:** a `@state() cellarToDelete: Cellar | null` drives an overlay + card rendered in the profile page's template, styled in analogy to the landing page's WebID dialog (shared class names `dialog-overlay`/`dialog`/`dialog-actions`/`dialog-btn`/`dialog-btn-cancel`/`dialog-btn-ok`, same CSS). `handleDeleteConfirm` deletes + refreshes + closes; `handleDeleteCancel` (also the overlay click) closes without deleting. The title is "Keller löschen", the body names the cellar, the primary button is "Löschen".
- **Order:** check emptiness → (empty) open dialog → confirm → delete. Confirming a cellar that can't be deleted anyway (non-empty) would be misleading, so the dialog lives inside the empty branch.
- **Why a styled dialog (not native `confirm`):** matches the app's visual language and the WebID dialog the user pointed to; a native `confirm` is unstylable and blocks the thread. The CSS is duplicated (not extracted to a shared component) to keep the change small; a shared dialog component can be factored out later.

### Decision 2: Non-empty cellar shows an informational dialog instead of auto-navigating
When the cellar still contains bottles, `handleDeleteCellarClick` opens a second styled dialog ("Löschen nicht möglich") explaining that a cellar with bottles cannot be deleted, rather than silently navigating to the cellar page as before. The dialog offers "Zum Keller" (navigate to the cellar page, preserving the prior "empty it first" affordance as an explicit choice) and "Schliessen" (dismiss).

- **Why:** the previous silent navigation gave no explanation for why the cellar wasn't deleted; an informational dialog tells the user why and still offers the path to fix it.
- **Implementation:** a separate `@state() cellarWithBottles: Cellar | null` drives the info dialog (distinct from `cellarToDelete`), reusing the same dialog CSS. `handleGoToCellar` navigates + closes; `handleCannotDeleteClose` (and overlay click) closes.
- **Alternative considered:** keep the auto-navigation and skip the dialog — rejected: it doesn't inform the user. Alternative: a dialog with only a close button (no navigation) — rejected: it would drop the useful path to empty the cellar.

## Risks / Trade-offs

- **[Dialog CSS duplicated from the landing page]** → Kept intentionally minimal; a shared `<kellermeister-dialog>` component could later consolidate the WebID, confirm, and info dialogs.
- **[Overlay click cancels/closes]** → Clicking the backdrop cancels (no deletion) / closes — the safe default; the inner card stops propagation so clicks inside don't dismiss it.
- **[Two dialog states on one page]** → `cellarToDelete` and `cellarWithBottles` are mutually exclusive by construction (set in opposite branches); each is cleared on its own close/confirm.

## Open Questions

None — the confirmation location (empty-delete branch) and mechanism (native `confirm`) are clear.
