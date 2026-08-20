## 1. Confirm before deleting

- [x] 1.1 In `profile-page.ts` `handleDeleteCellarClick`, inside the empty-cellar branch, open a styled confirmation dialog instead of deleting immediately; proceed with `removeCellar(cellar)` + `loadCellars()` only when the user confirms. Leave the non-empty (navigate) branch unchanged.

## 2. Styled dialog (analogy to the WebID dialog)

- [x] 2.1 Add a `@state() cellarToDelete: Cellar | null` and `handleDeleteConfirm` / `handleDeleteCancel` handlers.
- [x] 2.2 Render an overlay + card dialog ("Keller löschen", body naming the cellar, "Abbrechen" + "Löschen" buttons) at the top of `render()`, mirroring the landing page's WebID dialog markup.
- [x] 2.3 Add the WebID-dialog CSS (`dialog-overlay`, `dialog`, `dialog h2`, `dialog p`, `dialog-actions`, `dialog-btn`, `dialog-btn-cancel`, `dialog-btn-ok`) to the profile page's styles.

## 3. Informational dialog for non-empty cellars

- [x] 3.1 Add a `@state() cellarWithBottles: Cellar | null`; in `handleDeleteCellarClick`, the non-empty branch sets it (instead of navigating immediately).
- [x] 3.2 Render an informational dialog ("Löschen nicht möglich", body explaining bottles must be removed first, "Schliessen" + "Zum Keller" buttons), reusing the dialog styles.
- [x] 3.3 Add `handleGoToCellar` (navigate to the cellar page + close) and `handleCannotDeleteClose` (close) handlers.

## 4. Verification

- [x] 4.1 Typecheck (`tsc --noEmit`) and run the full test suite.
- [x] 4.2 Manually verify in the running app: empty cellar → styled confirm dialog ("Löschen" deletes + refreshes, "Abbrechen"/overlay leaves it); non-empty cellar → styled info dialog ("Zum Keller" navigates, "Schliessen" closes with no deletion, stays on profile). (Verified in-browser; screenshots confirm both dialogs match the WebID dialog styling.)
