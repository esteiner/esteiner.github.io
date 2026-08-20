## 1. Borderless delete buttons, close to names and aligned

- [x] 1.1 In `profile-page.ts`, remove the `ghost` attribute from the per-cellar delete `kellermeister-button` (borderless flat trash icon; keeps its green colour).
- [x] 1.2 Render the cellar names and delete buttons in a shared `.cellar-list` grid (`grid-template-columns: max-content max-content`, `align-items: center`, row/column gaps): each cellar's name is column 1, its delete button column 2 — so the buttons sit right after the names (close to the labels) and line up in a single vertical column.

## 2. Verification

- [x] 2.1 Typecheck (`tsc --noEmit`) and run the full test suite.
- [x] 2.2 Manually verify in the running app: with cellar names of differing length, the delete buttons have no border, sit directly after the name column (close to the labels), and line up at the same x. (Screenshot confirms; all buttons at the same left offset just after the widest name.)
