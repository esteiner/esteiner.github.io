## 1. Filter logic

- [x] 1.1 Add `private static parseBottleSizeMl(text): number | null` using `/^ml\s*(\d+)$/i` on the trimmed text
- [x] 1.2 In `filterProduct`, add a branch after the drinking-window one: for a size query, match only `product.getVolumeMl() === size`. A missing size doesn't match

## 2. Tests

- [x] 2.1 Add `volumeMl` / `getVolumeMl` to the `makeBottle` stub in `ProductFilter.test.ts`
- [x] 2.2 Add tests: `ml1500` matches 1500 and not 750 or a missing size; case and whitespace variants (`ML1500`, `ml 1500`, `  Ml   1500  `); regular fields not searched for a size query
- [x] 2.3 Add tests: a bare `1500` and the near-misses (`ml`, `ml 1500 rot`, `1500ml`, `mlx`) don't match by size
- [x] 2.4 Run `npx tsc --noEmit` and `npm test`, and confirm both pass
