## Context

`profile-page.ts` renders its sections as a flat sequence inside one `<main>`: each is a `<div class="section-header"><p>Name</p></div>` immediately followed by a `<div class="card">` holding that section's rows. There is no section component, no array of section descriptors, and no ordering logic — the order is simply the order of the literals in the template. Today that is Solid Profil, Kellermeister, Solid Apps, Debug.

The "Kellermeister" card is the only one with behaviour attached: the "Keller" group renders `this.cellars` and wires the add-cellar and per-cellar delete buttons. Those handlers are class methods bound in the template, and the dialogs they open (`newCellarName`, `cellarWithBottles`) are rendered separately, above `<kellermeister-header>`, not inside the card.

## Goals / Non-Goals

**Goals:**
- Make "Kellermeister" the first section on the profile page.
- Leave every section's contents, actions, and styling exactly as they are.

**Non-Goals:**
- Introducing a section abstraction, a section-order constant, or a reusable section component.
- Reordering rows within a section, or reordering the other three sections relative to each other.
- Making the order configurable by the user.

## Decisions

### Move the template literals, nothing else

The whole change is relocating the "Kellermeister" `section-header` + `card` pair above the "Solid Profil" pair in `render()`. Because the dialog rendering and all handlers live outside the card, moving the markup carries no logic with it and no bindings break.

*Alternative considered:* introduce a `sections` array of `{ title, render }` descriptors and iterate it, making order data rather than markup position. That is the change one would make if sections were about to become configurable or reusable — but nothing here asks for that, and it would turn a template move into a restructure of a 400-line page for no behaviour gain. Rejected as premature.

### Rely on CSS flow, not on new layout rules

The sections are plain sibling blocks in normal flow, so their visual order follows their DOM order and `main`'s padding applies uniformly. No section carries a first-child or last-child style, so no rule needs adjusting after the move — this is worth confirming in the styles block rather than assuming, since a `:first-child` margin rule would silently shift spacing.

## Risks / Trade-offs

- **A `:first-child` / `:last-child` style could make the reordered page space sections differently** → Check the page's styles for positional selectors on `.section-header` or `.card` before and after the move; the sections are otherwise uniformly styled.
- **A future section added to the top would push "Kellermeister" down again, with nothing to catch it** → Accepted: the order is markup position, and the new spec requirement records the intent, so a reviewer has something to point at.
