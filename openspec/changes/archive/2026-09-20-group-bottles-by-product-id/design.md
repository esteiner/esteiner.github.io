## Context

`KellermeisterService.bottlesFromCellarGroupedByProduct(cellar, filter)` builds a `Map<string, Bottle[]>` keyed by `bottle.getProduct().getName()`, then returns the map sorted by that name key. `cellar-page.ts` consumes only the map's **values**: it renders one `<li>` per group using `bottleGroup[0]` (the product shown) and `bottleGroup.length` (the count). The map key is never read by the view.

Because the app mints a distinct product resource per order item (`Product.getId()` is unique per resource), two orders of the same wine yield two products with equal names but different ids — and name-keyed grouping merges them into one row, showing only one product's details.

## Goals / Non-Goals

**Goals:**
- Group by `product.getId()` so distinct products stay distinct, even with identical names.
- Keep the current display order (by product name, case-insensitive) so identically-named rows sit adjacent.
- Avoid touching the view template — the change is confined to the grouping method.

**Non-Goals:**
- Changing what a single row shows, the count semantics, or the filtering.
- Merging/aggregating across product ids (that is the separate cross-order rating topic).
- Changing any other consumer (`bottlesFromCellar` and profile/order views are untouched).

## Decisions

### Decision 1: Key the group map by product id, order the entries by product name
Change the grouping key from `getProduct().getName()` to `getProduct().getId()`. After grouping, sort the entries by each group's product **name** (case-insensitive, via `bottleGroup[0].getProduct().getName()`), not by the id key — preserving today's alphabetical layout and keeping same-name groups adjacent.

- **Why:** Id-keying is the actual requirement; name-ordering preserves the existing UX. The view reads only values, so sorting must be applied to the returned map's entry order (as it is today).
- **Alternatives considered:**
  - *Key by id and sort by id.* Rejected — ordering would be by opaque resource URLs, scrambling the alphabetical list users rely on.
  - *Change the view to group instead of the service.* Rejected — duplicates logic in the component and leaves the service returning a misleadingly name-keyed map.

### Decision 2: Keep the `Map<string, Bottle[]>` return type
The signature stays `Map<string, Bottle[]>`; only the key's meaning changes (id instead of name). `cellar-page.ts` uses `.values()` only, so no template change is required.

- **Why:** Minimal blast radius; the sole caller does not depend on the key.
- **Note:** The method's neighbouring comment ("map with the product.id as key") on the *other* method (`bottlesFromCellar`) is unrelated; this method's behaviour is what changes.

## Risks / Trade-offs

- **A hidden dependency on the name key** → Verified the only caller (`cellar-page.ts`) reads `.values()` only; the key change is invisible to it. Any future caller relying on the key being a name would need updating.
- **Stable ordering for equal names** → Two groups with the same name are adjacent but their relative order is otherwise unspecified; acceptable, and matches the pre-change behaviour where they could not be distinguished at all.
- **More rows than before for multi-order wines** → Intended: it surfaces genuinely distinct products (with their own price/source/ratings) that were previously hidden.
