## Why

After the user edits a product's price on the cellar page, the read-only price still shows the old value. The new value only reappears when the user enters edit mode again. The price is saved correctly; only the display is stale.

**Cause:** the read-only price and the price input come from two different places:

- **Read-only display**: the page renders the price as slot content, e.g. `cellar-page.ts:174` `<bottle-component>${bottleGroup[0].getPrice()} ${…getPriceCurrency()}…</bottle-component>`. `bottle-component` forwards that slot to `product-component` (`<slot></slot>`), which shows it when not editing (`product-component.ts:118`). The page builds this text once, in its own render.
- **Edit input**: `product-component` reads `p.getPrice()` directly from the product and writes through with `p.setPrice(v)` (`product-component.ts:117`).

Editing updates the product model and persists it (`updateProduct`), but nothing makes `cellar-page` render again. The slotted text node keeps the old value, even after collapsing and re-expanding the row, because the slot content still belongs to the page. When the pencil is pressed again, the input reads the live model and shows the edited value. That is the "only visible when edited again" behaviour. The same wiring exists on `search-page.ts:106` and `cellarwork-page.ts:318`.

## What Changes

- `bottle-component` renders the bottle price itself (`bottle.getPrice()` / `getPriceCurrency()`) into `product-component`'s price slot. It renders again whenever the product is edited.
- `product-component` dispatches a `product-changed` event after every write-through, not only for name changes. `bottle-component` listens and calls `requestUpdate()`.
- `cellar-page`, `search-page` and `cellarwork-page` stop passing the price as slot content to `bottle-component`.
- `order-item-component` stays unchanged. It deliberately shows the *order item's* price paid, not the product price, and is read-only.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `product-inline-edit`: the write-through requirement explicitly covers the read-only display updating immediately after an edit, including the price.

## Impact

- `src/infrastructure/web/components/product-component.ts`: generalise the change event.
- `src/infrastructure/web/components/bottle-component.ts`: own the price display and re-render on change.
- `src/infrastructure/web/pages/cellar-page.ts`, `search-page.ts`, `cellarwork-page.ts`: remove the slotted price.
- `e2e/specs/edit-product.spec.ts`: new regression test for editing the price.
- No domain, service or data changes.
