## Context

`cellar-page` renders `<kellermeister-header>Keller ${name}...</kellermeister-header>`, where the header component is a thin Lit element with a default slot wrapped in an `h1` and a named `actions` slot. Its host box is *not* styled by the component itself — `BaseComponent.styles` styles the `kellermeister-header` element from the surrounding page: `position: fixed`, fixed `height: 64px`, `display: flex; justify-content: space-between; align-items: center`. So `h1` and `.actions-container` are the two flex children, and the header's height is fixed by a rule the component cannot see.

The bottle list is produced by a `@lit/task` `Task` calling `KellermeisterService.bottlesFromCellarGroupedByProduct(cellar, filter)`, re-run by `loadBottles()` after every mutation (filter toggles, search input, Altglass disposal, and the `CELLAR_UPDATED_EVENT` listener). `getAllBottles()` is served from an in-memory cache that `invalidate()` clears, so a second read over the same bottle set costs no network traffic.

The reference mockup is `notes/ui/header-with-bottles-count.jpg`: the right-hand phone shows `83 Flaschen` as a small line under the italic serif cellar title, in the same green, with the header keeping its existing height.

## Goals / Non-Goals

**Goals:**
- Show the cellar's total bottle count under the cellar name in the cellar view header.
- Keep the count correct as the cellar's contents change while the view is open.
- Extend `kellermeister-header` in a way that leaves every other page's header pixel-identical.

**Non-Goals:**
- Counts in the headers of other views (landing, cellarwork work view, order, search, profile).
- A per-filter or per-product-row count; the existing per-product count badges stay as they are.
- Any change to domain models, repositories, RDF shapes, or Pod storage.
- Restyling or resizing the header itself.

## Decisions

### The count is the cellar total, not the filtered total

The subline shows every bottle in the cellar regardless of the active wine-type or text filter. The filters answer "which wines do I want to look at", while the header answers "how big is this cellar" — a number that changes as you tap filter chips would be a second, noisier version of information the rows already carry.

*Alternative considered:* derive the number from the already-loaded grouped map (`[...bottles.values()].reduce((n, g) => n + g.length, 0)`). It is free — no second query — but it is inherently the *filtered* count and would contradict the requirement. Rejected.

*Trade-off:* the number can exceed the sum of the visible row badges while a filter is active. That is intended and matches how the mockup pairs a total with the filter row beneath it.

### Counting goes through a dedicated service method

Add `bottleCountInCellar(cellar: Cellar | undefined): Promise<number>` to `KellermeisterService`, implemented with `getAllBottles()` and the existing private `isBottleInThisCellar` predicate. Because `getAllBottles()` is cached, this is an in-memory pass over an already-loaded array, not a second fetch.

*Alternative considered:* call `bottlesFromCellar(cellar, new ProductFilter())` from the page. It works today, but it silently depends on a default-constructed `ProductFilter` matching everything, and it sorts a list only to throw it away. A named method states the intent and keeps the "unfiltered" decision in one place.

### The page drives the count with a second `Task`, re-run from `loadBottles()`

A `_bottleCountTask` sits next to `_bottlesTask`, and `loadBottles()` runs both. Every existing refresh path — filter toggles, search, Altglass disposal, `CELLAR_UPDATED_EVENT`, initial `onBeforeEnter` — already funnels through `loadBottles()`, so the count stays in step with the list for free, with no new event wiring. Filter toggles re-run the count redundantly; that is an in-memory array pass, which is cheaper than maintaining a separate, easy-to-forget refresh path.

*Alternative considered:* a plain `@state()` number updated by hand at each mutation site. Rejected — five call sites to keep in sync, and the asynchronous load would need manual sequencing.

While the count task is pending the subline renders nothing, so the header never flashes a wrong number, and on error it also renders nothing rather than showing an error inside the title block.

### The subline is a named slot, not a property

`kellermeister-header` gets a `subtitle` slot, mirroring the existing `actions` slot, and the page passes `<span slot="subtitle">83 Flaschen</span>`. The header stays a presentation-only component with no knowledge of bottles or German pluralisation, and any future view can add its own subline.

*Alternative considered:* a `subtitle` string property. Equivalent in effort, but breaks the component's existing all-slots convention and forbids rich content.

### Layout: a column wrapper around title and subline

`h1` and the new subtitle slot are wrapped in a `.title-container` with `display: flex; flex-direction: column`, which becomes the first flex child of the fixed-height host in place of the bare `h1`. A default `<slot>` element is `display: contents`, so when no subtitle is passed the wrapper contributes exactly the `h1`'s box and other pages' headers are unchanged. The existing 64px header height accommodates the 24px title plus a 16px subline without any height change — as in the mockup.

The subline inherits `font-family: var(--app-font-family-display)`, `font-style: italic`, and `color: var(--app-color-primary, #3A6B28)` from the title's rule, at `font-size: 16px` (two thirds of the title's 24px) — "same color and font, much smaller", per the request. Applied via `::slotted([slot="subtitle"])`, matching how the component already styles slotted actions.

### Pluralisation is a page-level string

`1 Flasche` / `n Flaschen` is decided in `cellar-page` when it builds the slotted text. German has only these two forms here; a formatting helper would be more machinery than the rule deserves. There is no i18n layer in this codebase — the UI is German throughout — so no message catalogue is involved.

## Risks / Trade-offs

- **The count disagrees with the sum of visible row badges while a filter is active** → Intended and specified; the number sits directly under the cellar name, above the filter row, so it reads as a property of the cellar rather than of the list.
- **A long cellar name plus the subline could crowd the fixed 64px header** → The title block is a column inside a box already sized for a 24px title with 4px/8px padding; a 16px subline fits. Verify against a long cellar name when implementing, and let the title wrap/ellipsize as it does today.
- **Adding a wrapper element around `h1` could shift other pages' header layout** → The wrapper is a column flex box with no padding, margin, or gap, and an unassigned slot renders no box; check the landing, order, search, profile, and cellarwork headers after the change.
- **A stale count if bottles change without a refresh path** → All known mutation paths already route through `loadBottles()`; the count reuses that exact path rather than adding a parallel one.

## Open Questions

- None blocking. If the count should later track the active filter after all, it becomes a one-line change in `cellar-page` (sum the grouped map instead of running the count task).
