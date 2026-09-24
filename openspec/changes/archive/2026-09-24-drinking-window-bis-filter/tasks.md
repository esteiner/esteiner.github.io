## 1. Filter logic

- [x] 1.1 Add a private helper in `ProductFilter` that parses `bis <year>` (trimmed, case-insensitive, `/^bis\s*(\d{4})$/i`) and returns the year or `null`
- [x] 1.2 In `filterProduct`, when a year is parsed, match only on `drinkingWindowTo.getFullYear() <= year`. Products without `drinkingWindowTo` do not match
- [x] 1.3 Otherwise, match only on the regular text fields (name, production date, grape variety, alcohol content, country, region). Remove the `drinkingWindowTo` branch
- [x] 1.4 Replace `isBiggerThan` with a clearly named helper and remove the debug `console.log`

## 2. Tests

- [x] 2.1 Update the existing drinking-window tests in `ProductFilter.test.ts` to use `bis 2025` / `bis 2020`
- [x] 2.2 Add tests for the inclusive boundary (same year), a missing `drinkingWindowTo`, and case/whitespace variants (`Bis 2025`, `BIS2025`, `  bis   2025  `)
- [x] 2.3 Add tests that a bare year (`2025`) and near-misses (`bis 25`, `bis 2025 rot`, `bisher`) do not match by drinking window
- [x] 2.4 Add a test that a `bis <year>` query does not search the regular text fields
- [x] 2.5 Run `npm test` and `npx tsc --noEmit`, and confirm both pass

## 3. Verification

- [x] 3.1 In the dev server, enter `bis 2025` and `2025` on the search page and check the results match the spec
