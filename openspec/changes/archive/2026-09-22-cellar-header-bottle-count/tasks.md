## 1. Service: unfiltered bottle count

- [x] 1.1 Add `bottleCountInCellar(cellar: Cellar | undefined): Promise<number>` to `src/application/KellermeisterService.ts`, implemented with `getAllBottles()` and the existing private `isBottleInThisCellar` predicate; return `0` for an undefined cellar
- [x] 1.2 Verify it applies no `ProductFilter` and triggers no extra fetch (it must read through the `cachedBottles` path)

## 2. Header component: optional subtitle slot

- [x] 2.1 In `src/infrastructure/web/components/kellermeister-header.ts`, wrap the `h1` and a new `<slot name="subtitle">` in a `.title-container` (`display: flex; flex-direction: column`) as the first flex child
- [x] 2.2 Style `::slotted([slot="subtitle"])` with the title's `font-family: var(--app-font-family-display)`, `font-style: italic`, `color: var(--app-color-primary, #3A6B28)`, at `font-size: 16px`, no margin
- [x] 2.3 Confirm that with no subtitle slotted the wrapper adds no box, margin, or gap

## 3. Cellar page: render the count

- [x] 3.1 In `src/infrastructure/web/pages/cellar-page.ts`, add a `_bottleCountTask` (`@lit/task`) that calls `bottleCountInCellar(this.cellar)`
- [x] 3.2 Run `_bottleCountTask` from `loadBottles()` alongside `_bottlesTask`, so every existing refresh path updates both
- [x] 3.3 Render the resolved count into `<span slot="subtitle">` inside `<kellermeister-header>`, formatted `1 Flasche` for exactly one and `n Flaschen` otherwise
- [x] 3.4 Render nothing in the subtitle slot while the count task is pending or has errored

## 4. Verify against the mockup and the other views

- [x] 4.1 Run `npm run build` and confirm the TypeScript compile passes
- [x] 4.2 In the running app, open a cellar and compare the header against `notes/ui/header-with-bottles-count.jpg` (right side): same green, same italic display font, markedly smaller, header height unchanged
- [x] 4.3 Check an empty cellar shows `0 Flaschen` and a one-bottle cellar shows `1 Flasche`
- [x] 4.4 Toggle each wine-type filter and enter a search text; confirm the header count stays at the cellar total while the rows below narrow
- [x] 4.5 Dispose a bottle to Altglass and confirm the header count drops by one without a reload
- [x] 4.6 Open the landing, order, search, profile, and cellarwork-work views and confirm their headers are unchanged
- [x] 4.7 Check a cellar with a long name for header crowding or clipping

## 5. Regression test

- [x] 5.1 Add `e2e/specs/cellar-bottle-count.spec.ts` covering the total, filter independence, the `0 Flaschen` / `1 Flasche` wording, the decrement on Altglass disposal, and the unchanged headers of the other views
