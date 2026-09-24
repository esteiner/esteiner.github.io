## 1. Month section toggle

- [x] 1.1 In `orders-component`, add `@state() private expanded = true` and a toggle method
- [x] 1.2 Render the month header as a `<button class="section-header">` with `aria-expanded`, a chevron, and the order count when collapsed. Keep the current header typography and reset button defaults
- [x] 1.3 Render the `<ul>` of orders only when expanded

## 2. Stable state across re-renders

- [x] 2.1 Check in `KellermeisterService.groupOrdersByMonth` that each month has a single Date key
- [x] 2.2 In `order-page`, render month sections with `repeat(..., month => month.getTime(), ...)` instead of `.map()`

## 3. Verification

- [x] 3.1 Run `npx tsc --noEmit` and `npm test`, and confirm both pass
- [x] 3.2 In the dev server: collapse/expand a month with the mouse and with the keyboard, check that other months are unaffected, and check that a collapsed month stays collapsed after toggling a colour filter
