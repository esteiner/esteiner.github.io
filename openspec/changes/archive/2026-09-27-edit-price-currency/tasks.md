## 1. Domain

- [x] 1.1 Add `setPriceCurrency(currency: string | undefined): void` to `Product` and implement it in `SoukaiProduct`

## 2. Edit UI

- [x] 2.1 Give `textField` an optional extra class and an `aria-label`. Give `numberInput` an optional `aria-label` as well
- [x] 2.2 In edit mode, render the "Preis / Flasche" row as `<span class="value range">` with the price number input (`aria-label="Preis"`) and the currency text input (`aria-label="Währung"`, class `currency-input`). An empty value is stored as `undefined`
- [x] 2.3 Add CSS `.value.range .currency-input { width: 4em; }`

## 3. Tests and verification

- [x] 3.1 Extend the e2e price test in `edit-product.spec.ts`: both inputs are on one line (same `y`), change the currency, leave edit mode and check the read-only price shows the new currency, then check that it survives a reload
- [x] 3.2 Run `npx tsc --noEmit` and `npm test`, and confirm both pass
- [x] 3.3 Run `edit-product.spec.ts`, and confirm all its tests pass
