## Context

The price shown in the read-only product details is slot content that the page provides. The page builds it once in its own render (`cellar-page`, `search-page`, `cellarwork-page`), and `bottle-component` passes it through to `product-component`'s default slot. The price input in edit mode reads and writes the `Product` model directly. Edits change the model and persist it, but they only notify the parent for name changes (`product-name-changed`), and only up to `bottle-component`. The page never renders again, so the slotted price stays stale. (See proposal for the full trace.)

The model itself is consistent: `SoukaiBottle.getPrice()` returns the product's price, and falls back to the legacy bottle `price` only when the product has none. So the fix is about who renders the price, not about data.

## Goals / Non-Goals

**Goals:**
- The read-only price always reflects the current product model after an edit.
- One clear owner for rendering the bottle price.

**Non-Goals:**
- Changing the order view: `order-item-component` keeps showing the order item price (price paid) through the slot.
- Removing the legacy bottle `price` fallback, or migrating data.
- Making the whole page re-render on product edits.

## Decisions

- **`bottle-component` owns the price display.** It renders `${bottle.getPrice()} ${bottle.getPriceCurrency()}` into `product-component`'s slot instead of forwarding page content. `bottle-component` re-renders on edit events, so the value is always fresh. It keeps using `Bottle.getPrice()` (not `Product.getPrice()`), so the legacy fallback for old bottles still works. Alternative: have `product-component` render `product.getPrice()` itself and drop the slot. Rejected because the order view needs the slot for the order item price, and because it would lose the legacy bottle fallback.
- **Generalise the change event.** `product-component.writeThrough` dispatches `product-changed` after every edit. `deriveName` keeps dispatching `product-name-changed`, which is now redundant; replace it with `product-changed` (only `bottle-component` listens). Alternative: dispatch only on persist (`change`). Rejected because dispatching on input also keeps the header name live, as today.
- **Pages stop slotting the price.** `cellar-page`, `search-page` and `cellarwork-page` pass only the `count` slot (where they use it). Alternative: have the pages listen for the event and re-render. Rejected because every page would have to repeat that wiring, and the page would re-render all rows for a one-row edit.

## Risks / Trade-offs

- [`cellarwork-page` shows the price without currency today] → After the change it shows the currency too, which is consistent with the other pages. The rows there are not editable, so behaviour is otherwise the same.
- [A price of `0` is falsy in `SoukaiBottle.getPrice()` and falls back to the legacy bottle price] → This bug already exists and is out of scope. Note it as a follow-up.
