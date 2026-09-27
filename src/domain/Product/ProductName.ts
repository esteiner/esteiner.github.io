/** Volume of a standard bottle; it gets no size suffix in the product name. */
const STANDARD_BOTTLE_ML = 750;

/**
 * The bottle-size suffix used in a product name, e.g. 1500 → "(1.5l)",
 * 3000 → "(3l)", 375 → "(0.375l)". Standard bottles (750 ml) and missing or
 * invalid volumes have no suffix.
 */
export function bottleSizeSuffix(volumeMl: number | undefined): string | undefined {
    if (volumeMl == null || !Number.isFinite(volumeMl) || volumeMl <= 0 || volumeMl === STANDARD_BOTTLE_ML) {
        return undefined;
    }
    return `(${volumeMl / 1000}l)`;
}

/**
 * Compose a product name as "<Hersteller> <Weinname> <Jahrgang> <Flaschengrösse>",
 * omitting empty parts.
 */
export function composeProductName(
    producer: string | undefined,
    wineName: string | undefined,
    year: number | undefined,
    volumeMl: number | undefined,
): string {
    return [producer, wineName, year, bottleSizeSuffix(volumeMl)]
        .filter((part) => part != null && String(part).trim() !== "")
        .join(" ");
}
