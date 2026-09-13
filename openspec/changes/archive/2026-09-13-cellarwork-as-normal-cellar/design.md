## Context

- `landing-page.handleCellarClick(cellarId)` currently branches: if the id is the cellarwork cellar (`endsWith("cellarwork#it")`) it routes to `cellarwork-page` (the work display); otherwise to `cellar-page` (the normal bottle view). The cellarwork cellar is labelled "Kellerarbeit" via `cellarName()`.
- `cellar-page` is the normal view for any cellar: `onBeforeEnter` → `loadCellar` + `loadBottles`; its header already has a **"Kellerarbeit"** button (`handleCellarworkClick`) that routes to `cellarwork-page` for the shown cellar.
- `cellarwork-page` is the work display: header shows an **umbuchen** action, `_bottlesTask` ingests the inbox on open (single-flight via `KellermeisterService.ingestOrdersFromInbox`), then lists bottles for transfer.
- `kellermeister-footer` (photo add) navigates to `cellarwork-page` for the cellarwork cellar after ingesting.

## Goals / Non-Goals

**Goals:**
- The cellarwork cellar opens to the normal bottle view; the work display is a drill-in from "Kellerarbeit".
- Inbox ingestion still fires when the cellarwork cellar is opened (normal view included).
- The footer photo add lands on the normal cellarwork view.

**Non-Goals:**
- No change to the work display's umbuchen/transfer behavior, or to what ingestion does.
- No change to other cellars or to the altglass well-known cellar.

## Decisions

### Decision 1: Route the cellarwork cellar to the normal cellar view

In `handleCellarClick`, drop the cellarwork special-case: route **all** cellars (including cellarwork) to `cellar-page`. The existing "Kellerarbeit" header button on `cellar-page` already provides the switch to `cellarwork-page`, so no new UI is needed for the drill-in.

### Decision 2: Ingest the inbox when the cellarwork cellar's normal view opens

`cellar-page` must keep the "orders become bottles on open" behavior for the cellarwork cellar (per product decision). When `cellar-page` is showing the cellarwork cellar (`cellarId === getCellarWorkId()`), it SHALL call `ingestOrdersFromInbox()` before/while loading bottles, then display the cellar's bottles. `ingestOrdersFromInbox` is single-flight and idempotent, so this composes safely with the work display also ingesting.

- **Alternative — ingest only on the work display:** rejected per product decision (inbox orders should still appear when the normal view is opened).

### Decision 3: Footer photo add navigates to the normal cellarwork view

`kellermeister-footer.convertAndIngest` (success path) SHALL navigate to `cellar-page` for the cellarwork cellar (its id) instead of `cellarwork-page`, so the user sees the newly added bottles in the normal view. The existing `CELLAR_UPDATED_EVENT` refresh still applies if that page is already mounted.

### Decision 4: Keep cellarwork-page as-is

`cellarwork-page` remains the work display, reached via the cellar view's "Kellerarbeit" button; it keeps ingesting on open (harmless, idempotent). No change needed there.

## Risks / Trade-offs

- **Same-route refresh** → When the footer navigates to the cellarwork cellar's `cellar-page`, if the user is already on that page the router no-op applies; the existing cellar-updated event should refresh it (verify; mirror the footer's current handling for the work display).
- **e2e churn** → The photo-capture e2e currently asserts `/cellarwork/` and uses "Kellerarbeit" to open the work display. It must be updated: opening the cellarwork cellar now lands on `/cellar/…`, and the photo add lands there too. Update selectors/URL waits accordingly.
- **Header label** → `cellar-page` shows "Keller {name}" while the landing labels the cellarwork cellar "Kellerarbeit". Optional nicety: show "Kellerarbeit" in the cellar-page header for this cellar; low priority, can be a follow-up.

## Migration Plan

Pure UI-routing/behavioral change; no data or contract changes. Revert by restoring the `handleCellarClick` special-case and the footer's `cellarwork-page` navigation.
