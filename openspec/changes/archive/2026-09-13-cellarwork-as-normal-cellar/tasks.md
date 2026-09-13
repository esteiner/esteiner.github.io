## 1. Route the cellarwork cellar to the normal view

- [x] 1.1 In `landing-page.handleCellarClick`, remove the cellarwork special-case so every cellar (including cellarwork) routes to `cellar-page`.
- [x] 1.2 Confirm the landing still labels the cellarwork cellar "Kellerarbeit" and uses the work icon (unchanged `cellarName`/`cellarIconName`).

## 2. Ingest the inbox from the normal cellarwork view

- [x] 2.1 In `cellar-page`, when the shown cellar is the cellarwork cellar (`cellarId === getCellarWorkId()`), trigger `ingestOrdersFromInbox()` on open (before/while loading bottles), then load and display the cellar's bottles. Handle the logged-out/no-op case gracefully (ingestion already returns safely).
- [x] 2.2 Keep `cellar-page`'s existing "Kellerarbeit" header button → `cellarwork-page` (the drill-in to the work display).

## 3. Footer photo add lands on the normal cellarwork view

- [x] 3.1 In `kellermeister-footer.convertAndIngest` (success path), navigate to `cellar-page` for the cellarwork cellar id instead of `cellarwork-page`; keep the `CELLAR_UPDATED_EVENT` refresh for the already-mounted case (ensure `cellar-page` also honours it, or navigation refreshes).

## 4. Verify

- [x] 4.1 Update `e2e/specs/photo-order-capture.spec.ts`: opening the cellarwork ("Kellerarbeit") cellar now lands on `/cellar/…` (bottle list); the photo add also lands there; assert the bottle count grows there. Add/adjust a check that the "Kellerarbeit" header action opens the work display (`/cellarwork/…`).
- [x] 4.2 Add/adjust a test that opening the cellarwork cellar's normal view still ingests the inbox (bottles appear), preserving `inbox-order-ingestion` behavior.
- [x] 4.3 Run `npm run build` (tsc + unit tests + vite) and the e2e spec (`VITE_ORDER_CONVERSION_URL=MOCKED …`); confirm green.
