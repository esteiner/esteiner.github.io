## 1. Pre-check

- [x] 1.1 Check the real Pod(s) for bottle resources under `private/kellermeister/v1/bottles/` that contain `schema:price`. If any belong to a product without a price, stop and add a migration task

## 2. Code removal

- [x] 2.1 In `bottle-component`, render `${bottle.getProduct().getPrice()} ${bottle.getProduct().getPriceCurrency()}` instead of `bottle.getPrice()` / `getPriceCurrency()`
- [x] 2.2 Remove `getPrice()` / `getPriceCurrency()` from `src/domain/Bottle/Bottle.ts` and `SoukaiBottle.ts`
- [x] 2.3 Remove the legacy `price` / `priceCurrency` fields and their comment from `SoukaiBottle.schema.ts`
- [x] 2.4 Search for any remaining bottle price references (`grep` for `getPrice` / `price` on bottles) and remove them

## 3. Tests and verification

- [x] 3.1 Add a unit test showing that a bottle whose resource contains a legacy `schema:price` shows no price when its product has none (proves the legacy field is no longer read)
- [x] 3.2 Run `npx tsc --noEmit` and `npm test`, and confirm both pass
- [x] 3.3 Run the `edit-product` e2e spec and confirm the price is still shown and editable on the cellar page
