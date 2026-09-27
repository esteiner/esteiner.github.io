## 1. Filter logic

- [x] 1.1 Add `private static parseRatingQuery(text): number | null` using `/^top\s*([1-3])$/i` on the trimmed text
- [x] 1.2 In `filterProduct`, add a branch after the bottle-size one: for a rating query, match only if `(product.getRatings() ?? []).some(r => r.getValue() === n)`

## 2. Tests

- [x] 2.1 Add `ratings` / `getRatings` to the `makeBottle` stub in `ProductFilter.test.ts`
- [x] 2.2 Add tests: `top3` matches a product rated 3; `top2` doesn't match one rated only 3; `top1` matches ratings [3, 1]; no ratings doesn't match; case and whitespace variants; regular fields not searched
- [x] 2.3 Add tests: `top`, `top0`, `top4`, `top 3 rot` and `topwein` are plain text, and don't match by rating
- [x] 2.4 Run `npx tsc --noEmit` and `npm test`, and confirm both pass
