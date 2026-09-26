## 1. Component changes

- [x] 1.1 In `product-component`, dispatch a bubbling `product-changed` event from `writeThrough`. Replace the `product-name-changed` dispatch in `deriveName`
- [x] 1.2 In `bottle-component`, listen for `product-changed` (instead of `product-name-changed`) and call `requestUpdate()`
- [x] 1.3 In `bottle-component`, render `${bottle.getPrice()} ${bottle.getPriceCurrency()}` as the `product-component` slot content instead of forwarding `<slot></slot>`

## 2. Page changes

- [x] 2.1 Remove the slotted price from `<bottle-component>` in `cellar-page.ts`, `search-page.ts` and `cellarwork-page.ts` (keep the `count` slot)
- [x] 2.2 Confirm `order-item-component` still slots the order item price and is unchanged

## 3. Tests and verification

- [x] 3.1 Add an e2e test to `e2e/specs/edit-product.spec.ts`: edit "Preis / Flasche", leave edit mode with the pencil, check that the read-only price shows the new value, then collapse and re-expand and check again
- [x] 3.2 Run `npx tsc --noEmit` and `npm test`, and confirm both pass
- [x] 3.3 Run the e2e suite `npm run test:e2e` (needs the local Solid server), or check the price edit by hand in the dev server
