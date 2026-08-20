## Context

Each cellar row on the profile page renders `<kellermeister-button icon="trash" size="small" ghost …>` inside `.cellar-row` (`display:flex; align-items:center; gap:8px`; name span followed by the button). The `ghost` variant draws the border: `.button.ghost { border: 1.5px solid var(--km-border) }` (in the button's shadow DOM), plus a white circle background and a hover border/box-shadow. The trash icon is coloured green regardless of `ghost` via `svg path { stroke: var(--app-color-primary) }`. Because the button follows the name in a flex row, its horizontal position depends on the name length, so the buttons are staggered rather than aligned.

## Goals / Non-Goals

**Goals:**
- Delete buttons render with no border (in all states).
- Delete buttons sit close to the cellar names (right after them, not at the far edge) AND line up in a single vertical column.

**Non-Goals:**
- Changing the "neuer Keller" add button (stays `ghost`).
- Changing delete/navigate behavior or the dialogs.
- Restyling the `kellermeister-button` component itself.

## Decisions

### Decision 1: Drop `ghost` to remove the border
Remove the `ghost` attribute from the delete button. A non-`ghost` button uses `.button { border: none; background: transparent }`, and the trash icon stays green (`svg path` stroke is the primary colour independent of `ghost`). This removes the border in every state (resting and hover), unlike overriding `--km-border`, which would leave the ghost hover border/box-shadow.

- **Why not override `--km-border: transparent` on the host?** Custom properties do pierce the shadow boundary, but `.button.ghost:hover` re-applies a coloured border and box-shadow, so the border would reappear on hover. Dropping `ghost` is simpler and complete.
- **Trade-off:** the delete button loses its white circular background and becomes a flat icon button — the intended "no border" look; it visually differentiates the destructive per-row action from the bordered add button.

### Decision 2: Lay the names and buttons out in a shared grid (close to the names AND aligned)
Replace the per-row flex wrapper with a single grid over the whole list: the list container `.cellar-list` is `display: grid; grid-template-columns: max-content max-content` with each cellar contributing two grid items — the name (`.cellar-name`) in column 1 and the delete button in column 2. Column 1 sizes to `max-content` (the widest cellar name), so every button starts at the same x — a straight vertical column — positioned immediately after the name column (close to the labels), not at the far edge.

- **Why a shared grid, not per-row flex?** Separate flex rows can't share a column width, so either the button follows each name (staggered) or is pushed to the far edge (disconnected). A single grid gives both proximity and alignment: the name column is exactly as wide as the longest name, buttons line up just after it.
- **`max-content` name column** adapts to the actual names (a long name widens the column for all rows) rather than relying on a guessed fixed width.
- **Alternatives considered:** per-row flex with `space-between` (aligned but far from names — rejected earlier by the user); per-row flex left-aligned (close but staggered — rejected); a fixed name width (brittle for long names).

## Risks / Trade-offs

- **[A very long cellar name widens the whole name column]** → Expected with `max-content`; the buttons stay aligned just after it. Acceptable for the small cellar list.
- **[Flat icon has a smaller hit area than the bordered circle]** → The button box (`size="small"` → 48px) is unchanged; only the border/background are removed, so the click target is preserved.

## Open Questions

None — remove `ghost` for the border; a shared grid gives close-to-name placement and column alignment together.
