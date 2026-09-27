## 1. Service

- [x] 1.1 Add `countBottles(): Promise<number>` to `KellermeisterService`. It uses `getAllBottles()` and leaves out bottles whose `getCellar()` equals `getAltglassId()`
- [x] 1.2 Add unit tests in `KellermeisterService.test.ts`: a mix of regular, Kellerarbeit, Altglass and cellar-less bottles; no Altglass bottles; no bottles

## 2. Profile page

- [x] 2.1 In `profile-page.ts`, set `numberOfBottles` from `countBottles()` instead of `getAllBottles().length`

## 3. Verification

- [x] 3.1 Run `npx tsc --noEmit` and `npm test`, and confirm both pass
- [x] 3.2 Check the "Flaschen" row on the profile page with the e2e seed data (`e2e/specs/profile-bottle-count.spec.ts`), and confirm it shows the count without Altglass
