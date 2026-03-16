import { describe, it, expect, beforeEach } from 'vitest';
import { ProductFilter } from './ProductFilter';
import type { Bottle } from '../Bottle/Bottle';

// Helper to build a minimal Bottle-shaped plain object for use in filterBottle().
function makeBottle(product: {
    name?: string;
    weinart?: string;
    weinfarbe?: string;
    traubensorte?: string;
    alkoholgehalt?: string;
    land?: string;
    region?: string;
    productionDate?: Date;
    trinkfensterBis?: Date;
}): Bottle {
    return { product } as unknown as Bottle;
}

describe('ProductFilter', () => {

    let filter: ProductFilter;

    beforeEach(() => {
        filter = new ProductFilter();
    });

    // -----------------------------------------------------------------
    // Toggle methods
    // -----------------------------------------------------------------

    describe('toggle methods', () => {
        it('toggleSprudelFilter flips isSprudel', () => {
            expect(filter.isSprudel).toBe(false);
            filter.toggleSprudelFilter();
            expect(filter.isSprudel).toBe(true);
            filter.toggleSprudelFilter();
            expect(filter.isSprudel).toBe(false);
        });

        it('toggleDessertFilter flips isDessert', () => {
            expect(filter.isDessert).toBe(false);
            filter.toggleDessertFilter();
            expect(filter.isDessert).toBe(true);
        });

        it('toggleWhiteFilter flips isWhite', () => {
            filter.toggleWhiteFilter();
            expect(filter.isWhite).toBe(true);
        });

        it('toggleRedFilter flips isRed', () => {
            filter.toggleRedFilter();
            expect(filter.isRed).toBe(true);
        });

        it('toggleRoseFilter flips isRose', () => {
            filter.toggleRoseFilter();
            expect(filter.isRose).toBe(true);
        });

        it('toggleTextFilter flips isText', () => {
            filter.toggleTextFilter();
            expect(filter.isText).toBe(true);
        });
    });

    // -----------------------------------------------------------------
    // filterBottle — no active filters
    // -----------------------------------------------------------------

    describe('filterBottle with no active filters', () => {
        it('passes any bottle when no filter is active', () => {
            const bottle = makeBottle({ name: 'Château Margaux', weinart: 'Wein', weinfarbe: 'rot' });
            expect(filter.filterBottle(bottle)).toBe(true);
        });

        it('passes a bottle with no product data when no filter is active', () => {
            const bottle = makeBottle({});
            expect(filter.filterBottle(bottle)).toBe(true);
        });
    });

    // -----------------------------------------------------------------
    // filterBottle — Weinart filters
    // -----------------------------------------------------------------

    describe('filterBottle with isSprudel', () => {
        beforeEach(() => { filter.isSprudel = true; });

        it('passes a Schaumwein bottle', () => {
            expect(filter.filterBottle(makeBottle({ weinart: 'Schaumwein' }))).toBe(true);
        });

        it('blocks a Wein bottle', () => {
            expect(filter.filterBottle(makeBottle({ weinart: 'Wein' }))).toBe(false);
        });

        it('blocks a Dessertwein bottle', () => {
            expect(filter.filterBottle(makeBottle({ weinart: 'Dessertwein' }))).toBe(false);
        });

        it('passes a bottle with undefined weinart (treated as match)', () => {
            // Weinart.equals(undefined) returns true
            expect(filter.filterBottle(makeBottle({}))).toBe(true);
        });
    });

    describe('filterBottle with isDessert', () => {
        beforeEach(() => { filter.isDessert = true; });

        it('passes a Dessertwein bottle', () => {
            expect(filter.filterBottle(makeBottle({ weinart: 'Dessertwein' }))).toBe(true);
        });

        it('blocks a Wein bottle', () => {
            expect(filter.filterBottle(makeBottle({ weinart: 'Wein' }))).toBe(false);
        });
    });

    // -----------------------------------------------------------------
    // filterBottle — Weinfarbe filters
    // -----------------------------------------------------------------

    describe('filterBottle with isRed', () => {
        beforeEach(() => { filter.isRed = true; });

        it('passes a red wine', () => {
            expect(filter.filterBottle(makeBottle({ weinfarbe: 'rot' }))).toBe(true);
        });

        it('blocks a white wine', () => {
            expect(filter.filterBottle(makeBottle({ weinfarbe: 'weiss' }))).toBe(false);
        });

        it('blocks a rosé wine', () => {
            expect(filter.filterBottle(makeBottle({ weinfarbe: 'rose' }))).toBe(false);
        });

        it('passes a bottle with undefined weinfarbe (treated as match)', () => {
            expect(filter.filterBottle(makeBottle({}))).toBe(true);
        });
    });

    describe('filterBottle with isWhite', () => {
        beforeEach(() => { filter.isWhite = true; });

        it('passes a white wine', () => {
            expect(filter.filterBottle(makeBottle({ weinfarbe: 'weiss' }))).toBe(true);
        });

        it('blocks a red wine', () => {
            expect(filter.filterBottle(makeBottle({ weinfarbe: 'rot' }))).toBe(false);
        });
    });

    describe('filterBottle with isRose', () => {
        beforeEach(() => { filter.isRose = true; });

        it('passes a rosé wine', () => {
            expect(filter.filterBottle(makeBottle({ weinfarbe: 'rose' }))).toBe(true);
        });

        it('blocks a red wine', () => {
            expect(filter.filterBottle(makeBottle({ weinfarbe: 'rot' }))).toBe(false);
        });
    });

    // -----------------------------------------------------------------
    // filterBottle — combined filters (AND logic)
    // -----------------------------------------------------------------

    describe('combined filters apply AND logic', () => {
        it('passes only when both weinart and weinfarbe match', () => {
            filter.isSprudel = true;
            filter.isWhite = true;
            expect(filter.filterBottle(makeBottle({ weinart: 'Schaumwein', weinfarbe: 'weiss' }))).toBe(true);
            expect(filter.filterBottle(makeBottle({ weinart: 'Schaumwein', weinfarbe: 'rot' }))).toBe(false);
            expect(filter.filterBottle(makeBottle({ weinart: 'Wein', weinfarbe: 'weiss' }))).toBe(false);
        });

        it('isRed and isSprudel together require rot + Schaumwein', () => {
            filter.isRed = true;
            filter.isSprudel = true;
            expect(filter.filterBottle(makeBottle({ weinart: 'Schaumwein', weinfarbe: 'rot' }))).toBe(true);
            expect(filter.filterBottle(makeBottle({ weinart: 'Wein', weinfarbe: 'rot' }))).toBe(false);
        });
    });

    // -----------------------------------------------------------------
    // filterBottle — text filter
    // -----------------------------------------------------------------

    describe('filterBottle with text filter', () => {
        beforeEach(() => {
            filter.isText = true;
        });

        it('passes when name matches (case-insensitive)', () => {
            filter.textFilter = 'bordeaux';
            expect(filter.filterBottle(makeBottle({ name: 'Château Bordeaux', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
            expect(filter.filterBottle(makeBottle({ name: 'CHÂTEAU BORDEAUX', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
        });

        it('blocks when name does not match and other fields are absent', () => {
            filter.textFilter = 'riesling';
            // bottle has a defined trinkfensterBis so the ternary fallback can be evaluated
            expect(filter.filterBottle(makeBottle({ name: 'Chardonnay', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(false);
        });

        it('passes when traubensorte matches', () => {
            filter.textFilter = 'pinot';
            expect(filter.filterBottle(makeBottle({ traubensorte: 'Pinot Noir', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
        });

        it('passes when alkoholgehalt matches', () => {
            filter.textFilter = '13.5';
            expect(filter.filterBottle(makeBottle({ alkoholgehalt: '13.5%', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
        });

        it('passes when land matches (case-insensitive)', () => {
            filter.textFilter = 'frankreich';
            expect(filter.filterBottle(makeBottle({ land: 'Frankreich', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
        });

        it('passes when region matches (case-insensitive)', () => {
            filter.textFilter = 'burgund';
            expect(filter.filterBottle(makeBottle({ region: 'Burgund', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
        });

        it('passes when trinkfensterBis year <= textFilter year (only when no other fields match)', () => {
            filter.textFilter = '2025';
            const bottle = makeBottle({ trinkfensterBis: new Date(2024, 0, 1) });
            expect(filter.filterBottle(bottle)).toBe(true);
        });

        it('blocks when trinkfensterBis year > textFilter year (and no other fields match)', () => {
            filter.textFilter = '2020';
            const bottle = makeBottle({ trinkfensterBis: new Date(2025, 0, 1) });
            expect(filter.filterBottle(bottle)).toBe(false);
        });

        it('passes any text when textFilter is null', () => {
            filter.textFilter = null;
            expect(filter.filterBottle(makeBottle({ name: 'anything', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
        });

        // Documents the operator-precedence behaviour: because the ternary has lower
        // precedence than ||, a bottle with trinkfensterBis === undefined always
        // satisfies the text filter regardless of the search term.
        it('passes any text filter when trinkfensterBis is undefined (operator precedence)', () => {
            filter.textFilter = 'xyz_no_match';
            const bottle = makeBottle({ name: 'Completely Different Wine' }); // no trinkfensterBis
            expect(filter.filterBottle(bottle)).toBe(true);
        });

        it('combines text filter with weinfarbe filter using AND logic', () => {
            filter.textFilter = 'bordeaux';
            filter.isRed = true;
            expect(filter.filterBottle(makeBottle({ name: 'Bordeaux Rouge', weinfarbe: 'rot', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
            expect(filter.filterBottle(makeBottle({ name: 'Bordeaux Blanc', weinfarbe: 'weiss', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(false);
        });
    });
});
