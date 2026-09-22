## 1. Reorder the sections

- [x] 1.1 In `src/infrastructure/web/pages/profile-page.ts`, move the "Kellermeister" `section-header` + `card` pair above the "Solid Profil" pair in `render()`, leaving both blocks' contents byte-identical
- [x] 1.2 Confirm the resulting order in the template is Kellermeister → Solid Profil → Solid Apps → Debug

## 1b. Rename the page to "Kellerprofil"

- [x] 1b.1 In `src/infrastructure/web/components/kellermeister-footer.ts`, change the profile button's `text` from "Profil" to "Kellerprofil"
- [x] 1b.2 In `src/infrastructure/web/pages/profile-page.ts`, change the `kellermeister-header` title from "Profil" to "Kellerprofil", leaving the "Solid Profil" section header unchanged
- [x] 1b.3 Confirm the longer label still fits the four-item footer at phone width without crowding or wrapping

## 2. Check the styling survives the move

- [x] 2.1 Search the page's styles block for positional selectors (`:first-child`, `:last-child`, `+`, `~`) on `.section-header` or `.card`, and confirm none of them make spacing depend on which section comes first
- [x] 2.2 Run `npm run build` and confirm the TypeScript compile and unit tests pass

## 3. Verify in the running app

- [x] 3.1 Open the profile page and confirm "Kellermeister" is the first section, followed by Solid Profil, Solid Apps, Debug
- [x] 3.2 Confirm the Kellermeister section still shows Version, Flaschen, and the Keller list, and that adding and deleting a cellar still work from their new position
- [x] 3.3 Confirm section spacing looks unchanged from before the move

## 4. Regression test

- [x] 4.1 Add `e2e/specs/profile-section-order.spec.ts` asserting the section order, the "Kellerprofil" title and footer label, that the leading Kellermeister section kept its rows, and that section spacing is unchanged
