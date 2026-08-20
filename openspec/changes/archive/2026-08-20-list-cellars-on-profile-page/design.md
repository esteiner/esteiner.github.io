## Context

`profile-page.ts` is a Lit `BasePage`. On `connectedCallback` it calls `fetchUserProfile()`, which loads the Solid profile and the bottle count (`getAllBottles().length`) into `@state()` fields. The template (profile-page.ts:99-112) has a "Kellermeister" card with `Version`, `Flaschen`, and a `Keller` `.group` whose value cell is empty.

`KellermeisterService` exposes:
- `getAllCellars()` — all persisted cellars (visible + hidden + the well-known `cellarwork`/`altglass`), deduplicated. This is the "all existing cellars" set.
- `getCellars()` — visible cellars plus the two well-known ones appended; not the full set.

`Cellar` provides `getId()`, `getName()`, `getDisplayOrder()`.

## Goals / Non-Goals

**Goals:**
- Show the names of all existing cellars in the profile page's `Keller` group.
- Load them local-first (works offline, like the rest of the profile page's data).

**Non-Goals:**
- Cellar CRUD from the profile page (create/rename/delete stays on the landing/cellar pages).
- Sorting/grouping cellars beyond a simple, stable display order.
- Introducing a new service method — `getAllCellars()` already fits.

## Decisions

### Decision 1: Source from `getAllCellars()`, then hide negative `displayOrder`
Use `KellermeisterService.getAllCellars()` as the base set (complete, deduplicated), then filter out cellars with a negative `displayOrder` before display. A missing or zero `displayOrder` stays visible; only strictly-negative values are hidden (the guard is `!(getDisplayOrder() < 0)`, so `undefined`/`0` are treated as visible).

- **Why:** `getAllCellars()` is the full, deduplicated set; `getCellars()` filters to visible and re-appends the well-known cellars (partial, and can duplicate). Negative-`displayOrder` cellars (the well-known `cellarwork`/`altglass`) are internal and should not appear in the profile overview.
- **Alternatives considered:** `getCellars()` — rejected (partial, can duplicate). `getAllVisibleCellars()` — its `isVisible` happens to also hide negatives today, but the profile requirement is specifically "hide `displayOrder < 0`," so an explicit filter keeps the two concerns independent.

### Decision 2: Load cellars in the existing profile load path, hold in state
Add a `@state() private cellars: Cellar[] = []` and populate it in `fetchUserProfile()` (or a small `loadCellars()` called from `connectedCallback`), mirroring the existing bottle-count load. Render `this.cellars.map(c => c.getName())` inside the `Keller` group's value cell.

- **Why:** consistent with how `numberOfBottles` is already loaded and rendered; keeps the change local to the component.
- **Display:** render each cellar name (e.g. one per line, or comma-separated) using the existing `.value` styling. While loading or when empty, show a neutral placeholder (e.g. "—" or "Keine Keller").
- **Alternative considered:** a `@lit/task` like the landing page — heavier than needed here; a plain state field matches the profile page's current style.

### Decision 3: Add-cellar action reuses `createCellar` + a `prompt`
Place a `kellermeister-button` (icon `plus`, `ghost`, `size="small"`) in the "Keller" group, right-aligned via a `.group-keller` modifier that extends the grid to `110px 1fr auto`. Its handler mirrors the landing page's `handleNewCellarClick`: `prompt` for a name, `KellermeisterService.createCellar(name)`, then `loadCellars()` to refresh.

- **Why:** `createCellar` already exists and clears the cellar cache, so a re-fetch shows the new cellar; a `prompt` matches the landing page's existing UX and avoids building a dialog.
- **Alternative considered:** a custom inline input/dialog — rejected as heavier than the established `prompt` pattern for this app.

### Decision 4: Delete-or-navigate per cellar, gated on emptiness
Render a delete `kellermeister-button` (icon `trash`) behind each cellar name. Its handler asks `KellermeisterService.isCellarEmpty(cellar)` (a thin public wrapper over the existing private `isEmpty`, which counts the cellar's bottles): if empty, call `removeCellar(cellar)` and `loadCellars()`; if not, `Router.go` to the `cellar-page` route for that cellar id.

- **Why:** `removeCellar` already refuses to delete a non-empty cellar (it re-checks `isEmpty`), so the emptiness check is authoritative in the application layer; the UI only needs the boolean to choose delete vs navigate. Navigating a non-empty cellar to its page lets the user empty it (matching the landing page's `cellar-page` navigation).
- **Emptiness source:** the application layer (`isEmpty` → `bottlesFromCellar`), not a component-side bottle scan, keeping the "no bottles" rule in one place. `removeCellar` re-validates, so there is no check-then-act race.
- **Scope note:** only user cellars appear in this list (negative-`displayOrder` well-known cellars are filtered out), so the delete/navigate action never targets `cellarwork`/`altglass`.
- **Alternative considered:** compute emptiness from the profile page's already-loaded bottle list — rejected to avoid duplicating the rule and to reuse `removeCellar`'s guarantee.

## Risks / Trade-offs

- **[Cellar names may be long / list may be large]** → Reuse the card's existing `word-break`/wrapping styles; a simple list is acceptable for the expected small number of cellars.
- **[Well-known cellars appear in the list]** → Hidden: cellars with a negative `displayOrder` (the well-known `cellarwork`/`altglass`) are filtered out.
- **[`displayOrder` may be `undefined`]** → The guard `!(getDisplayOrder() < 0)` treats `undefined`/`0` as visible; only strictly-negative values are hidden.

## Open Questions

None — the data source (`getAllCellars()`) and the render location (the existing `Keller` group) are clear.
