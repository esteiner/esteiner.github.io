## Context

`ProductFilter.filterProduct` (`src/domain/Product/ProductFilter.ts`) builds the text match as one OR expression over several product fields. The last branch, `isBiggerThan(textFilter, drinkingWindowTo.getFullYear())`, compares `year <= Number(textFilter)` for every search text. Any numeric text (a vintage, `13`, …) therefore also matches by drinking window. `ProductFilter` is used by the search, cellar, cellarwork and order pages.

## Goals / Non-Goals

**Goals:**
- Only use `drinkingWindowTo` when the user explicitly asks for it with `bis <year>`.
- Keep the change in the domain filter so all pages behave the same.

**Non-Goals:**
- No new UI (e.g. a dedicated drinking-window input or chip).
- No other query syntaxes (`ab <year>`, ranges, combining `bis <year>` with free text).
- No changes to URL parameters: the raw text is still stored in `text`.

## Decisions

- **Parse with a regex in `ProductFilter`**: `/^bis\s*(\d{4})$/i` applied to the trimmed text. A private helper (e.g. `parseDrinkingWindowYear(text): number | null`) returns the year or `null`. It lives next to the filter logic because that is where the text is interpreted. Alternative: parse in the page and set a separate `drinkingWindowYear` field on the filter. Rejected because four pages would need the same change and the URL format would change.
- **Exclusive branches**: if a year is parsed, only the drinking-window comparison applies. Otherwise, only the text-field OR expression applies. Alternative: keep the text fields as an OR next to the drinking window for `bis` queries. Rejected because the literal `bis 2025` would hardly ever appear in a field, and mixing the two makes results harder to understand.
- **Missing `drinkingWindowTo` doesn't match**: a `bis` query asks for bottles that should be drunk by that year. A product without a drinking window gives no evidence for that.
- **Year boundary is inclusive** (`<=`), the same as today's comparison.
- Replace `isBiggerThan` with a clearer helper (e.g. `endsDrinkingWindowBy(year, product)`) and drop the debug `console.log`.

## Risks / Trade-offs

- [Users who relied on typing a bare year to find bottles to drink] → Mitigation: `bis 2025` is short and explicit. Mention it in the release notes/ToDo if needed.
- [A 4-digit-only regex rejects 2-digit years (`bis 25`)] → Accepted. This keeps parsing unambiguous, and it falls back to plain text search.
