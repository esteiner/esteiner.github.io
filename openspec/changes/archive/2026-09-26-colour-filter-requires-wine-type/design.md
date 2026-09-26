## Context

`ProductFilter.filterProduct` ANDs together independent checks for Sprudel (`Schaumwein`), Dessert (`Dessertwein`) and each colour (`weinfarbe`). `Weinart.equals` / `Weinfarbe.equals` return `true` for `undefined`, so products with missing attributes pass. The working tree already extends each colour branch with `if (!this.isSprudel) require <Farbe>wein`, and adds `Rotwein`/`Weisswein`/`Rosewein` to `Weinart`. Stored values (seed): `Schaumwein`, `Rotwein`, `Weisswein`, `Rosewein`, `Dessertwein`, with no generic `Wein`.

## Goals / Non-Goals

**Goals:**
- A colour filter on its own returns still wine of that colour.
- Sprudel/Dessert + colour keep their "type of that colour" meaning without contradiction.

**Non-Goals:**
- Adding a Dessert button to the UI.
- Changing how undefined Weinart/Weinfarbe are treated (still a match).
- Changing the OR/AND semantics when several colours are active at once. Today they are ANDed, which already yields no results for two different colours. That is unchanged.
- Migrating generic `Wein` values.

## Decisions

- **Guard on "no Weinart filter active" instead of only `!isSprudel`.** Use a local `const typeFilterActive = this.isSprudel || this.isDessert`, and require the still-wine type only when it is `false`. Alternative: guard on `!isSprudel` only, as currently implemented. Rejected because Dessert + colour could then never match (it would require `Dessertwein` and `Weisswein` at once).
- **Keep the colour→Weinart mapping inline in each colour branch**, as the refactor already does. Alternative: a `Weinfarbe → Weinart` lookup map. Rejected because three branches are readable and match the file's style.
- **Keep `equals(undefined) === true`.** Products that have not been classified stay visible, as today.
- Delete the commented-out `!isSprudel` block, which is superseded by this rule.

## Risks / Trade-offs

- [Pods holding products with the generic Weinart `Wein` would drop out of colour filters] → The seed has none. If a real Pod has any, they can be fixed with inline product editing, or in a follow-up migration.
- [The single `Dessertwein` / `weiss` product no longer appears under "Weiss"] → Intended: it is a dessert wine, not a white wine. It is still found with Dessert + Weiss via the URL.
