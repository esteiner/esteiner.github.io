## 1. Name composition helpers

- [x] 1.1 Create `src/domain/Product/ProductName.ts` with `bottleSizeSuffix(volumeMl)`: `undefined` for missing / non-finite / ≤ 0 / 750; otherwise `` `(${volumeMl / 1000}l)` ``
- [x] 1.2 Add `composeProductName(producer, wineName, year, volumeMl)` to the same file: join the non-empty parts (trimmed-empty strings omitted) with single spaces, the size suffix last
- [x] 1.3 Add `src/domain/Product/ProductName.test.ts` covering 750 → none, undefined → none, 1500 → `(1.5l)`, 3000 → `(3l)`, 375 → `(0.375l)`, 500 → `(0.5l)`, and composition with missing parts (no double spaces, e.g. producer + size only)

## 2. Wire into the inline editor

- [x] 2.1 Replace the body of `deriveName()` in `src/infrastructure/web/components/product-component.ts` with a call to `composeProductName(p.getProducer(), p.getWineName(), p.getProductionDate()?.getFullYear(), p.getVolumeMl())`, and update its doc comment to mention Flaschengrösse
- [x] 2.2 Change the Flaschengrösse `numberInput` setter to `(v) => { p?.setVolumeMl(v); this.deriveName(); }`
- [x] 2.3 Update the `product-inline-edit` spec's Purpose sentence so it lists Flaschengrösse among the name-defining attributes

## 3. Verification

- [x] 3.1 Extend `e2e/specs/edit-product.spec.ts`: in edit mode set Flaschengrösse to 1500 → header name ends with "(1.5l)"; set it back to 750 → the suffix is gone; the name persists after a reload
- [x] 3.2 Run `npm run build` (tsc + vitest + vite build) and `npm run test:e2e -- edit-product` and confirm both pass
