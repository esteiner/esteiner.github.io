## Why

The cellar view's header shows only the cellar name, so the user has to scroll the whole product list and add up the per-product counts to learn how many bottles the cellar actually holds. The mockup in `notes/ui/header-with-bottles-count.jpg` (right-hand variant) puts that number directly under the cellar name — the single most useful fact about a cellar, available at a glance.

## What Changes

- The cellar page header shows the **total number of bottles in the cellar** as a subline under the cellar name, e.g. `83 Flaschen`.
- The subline uses the **same font family, style and color as the existing header title**, at a **much smaller font size**, matching the mockup.
- The count is the **total for the cellar** and is **not** reduced by the active wine-type or text filter — filters change the product rows below, not the cellar's total.
- The count stays current: it is recomputed whenever the cellar's bottles change (bottle disposal to Altglass, inbox ingestion, and the `cellar-updated` event).
- `kellermeister-header` gains an optional **subtitle slot**. Headers that pass no subtitle (landing, order, search, profile, cellarwork pages) render exactly as before.

## Capabilities

### New Capabilities
- `cellar-bottle-count-header`: displaying a cellar's total bottle count in the cellar view header, including its wording, filter independence, and refresh behaviour.

### Modified Capabilities
<!-- No existing spec's requirements change. `cellar-bottle-grouping` still describes the product rows; this change only adds a header element above them. -->

## Impact

- `src/infrastructure/web/components/kellermeister-header.ts` — new optional `subtitle` slot plus its styling.
- `src/infrastructure/web/pages/cellar-page.ts` — compute the cellar's total bottle count and render it into the new slot; refresh it alongside the existing bottle list reloads.
- `src/application/KellermeisterService.ts` — a read path for the unfiltered bottle count of a cellar (existing `bottlesFromCellar` with an empty filter, or a dedicated count method).
- No domain, repository, RDF, or Pod-storage changes. No new dependencies.
