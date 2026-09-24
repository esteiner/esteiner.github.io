## Why

The order page lists every order grouped by month. As orders build up, the list gets long, and you have to scroll past older months to find what you need. Letting you collapse a month section keeps the page easy to scan.

## What Changes

- Each month section header on the order page (e.g. "September 2026") becomes a toggle that collapses and expands the orders of that month.
- Month sections start expanded, so what the page shows by default does not change.
- The header shows a chevron that shows whether the section is expanded or collapsed. When collapsed, it also shows the number of orders in that month.
- The toggle works with the keyboard and screen readers: it is a button with `aria-expanded`.
- The collapsed/expanded state stays with the correct month when the list is re-rendered (e.g. after a filter change).

## Capabilities

### New Capabilities
- `order-month-collapse`: Collapsing and expanding month sections on the order page.

### Modified Capabilities
<!-- none -->

## Impact

- `src/infrastructure/web/components/orders-component.ts` — collapse state, clickable header, chevron, order count.
- `src/infrastructure/web/pages/order-page.ts` — render month sections with a keyed `repeat` so state stays with its month.
- No domain, service, data or routing changes.
