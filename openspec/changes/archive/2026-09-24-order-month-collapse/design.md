## Context

`order-page` loads `Map<Date, Order[]>` via `ordersGroupedByMonth(filter)` and renders one `<orders-component .month .orders>` per month with a plain `.map()`. `orders-component` renders an italic `.section-header` and a `<ul>` of `order-component`s. Other components (`bottle-component`, `order-item-component`) already expand and collapse with a local `@state() expanded` toggled by a click handler.

## Goals / Non-Goals

**Goals:**
- Collapse/expand per month section, starting expanded.
- Accessible toggle (button, `aria-expanded`).
- Collapse state stays with the correct month when the list is re-rendered.

**Non-Goals:**
- Keeping the state after the user leaves the page or reloads it (e.g. in localStorage).
- "Collapse all / expand all" controls.
- Animated height transitions.

## Decisions

- **State lives in `orders-component`** as `@state() private expanded = true`, the same local-state pattern as `bottle-component`/`order-item-component`. Alternative: a `Set` of collapsed month keys in `order-page`, passed down as a property. Rejected because it adds event plumbing without a need, since nothing else reads the state.
- **Keyed rendering in `order-page`**: switch the month `.map()` to Lit's `repeat(months, m => m.getTime(), …)`. Without keys, Lit reuses component instances by position, so after a filter change a collapsed state would move to whichever month now sits in that slot. `getTime()` works as a key because the grouping creates one Date per month (first of month).
- **Header becomes a `<button class="section-header">`** that keeps the current typography (reset the button's default styles, full width, text left-aligned), with `aria-expanded` and a chevron. The chevron is an inline `▸`/`▾` character or a small rotated SVG. No new icon asset is needed. When collapsed, the header also shows a muted order count (e.g. "· 3").
- **Hide by not rendering** the `<ul>` when collapsed (`nothing`), matching how the other components hide expanded content.

## Risks / Trade-offs

- [Two month keys could collide if grouping ever produced several Date objects for the same month] → They would collide on the same `getTime()` only if they are truly equal. Check the key in `groupOrdersByMonth` during implementation.
- [State is lost when leaving the page] → Accepted per Non-Goals. It can be added later with `sessionStorage`, keyed by month.
