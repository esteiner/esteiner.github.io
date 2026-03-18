import { describe, it, expect, beforeEach } from 'vitest';
import { ProductFilter } from './ProductFilter';
import type { Product } from './Product';

// Helper to build a minimal Product-shaped plain object for use in filterProduct().
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
}): Product {
    return product as unknown as Product;
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
    // filterProduct — no active filters
    // -----------------------------------------------------------------

    describe('filterProduct with no active filters', () => {
        it('passes any bottle when no filter is active', () => {
            const bottle = makeBottle({ name: 'Château Margaux', weinart: 'Wein', weinfarbe: 'rot' });
            expect(filter.filterProduct(bottle)).toBe(true);
        });

        it('passes a bottle with no product data when no filter is active', () => {
            const bottle = makeBottle({});
            expect(filter.filterProduct(bottle)).toBe(true);
        });
    });

    // -----------------------------------------------------------------
    // filterProduct — Weinart filters
    // -----------------------------------------------------------------

    describe('filterProduct with isSprudel', () => {
        beforeEach(() => { filter.isSprudel = true; });

        it('passes a Schaumwein bottle', () => {
            expect(filter.filterProduct(makeBottle({ weinart: 'Schaumwein' }))).toBe(true);
        });

        it('blocks a Wein bottle', () => {
            expect(filter.filterProduct(makeBottle({ weinart: 'Wein' }))).toBe(false);
        });

        it('blocks a Dessertwein bottle', () => {
            expect(filter.filterProduct(makeBottle({ weinart: 'Dessertwein' }))).toBe(false);
        });

        it('passes a bottle with undefined weinart (treated as match)', () => {
            // Weinart.equals(undefined) returns true
            expect(filter.filterProduct(makeBottle({}))).toBe(true);
        });
    });

    describe('filterProduct with isDessert', () => {
        beforeEach(() => { filter.isDessert = true; });

        it('passes a Dessertwein bottle', () => {
            expect(filter.filterProduct(makeBottle({ weinart: 'Dessertwein' }))).toBe(true);
        });

        it('blocks a Wein bottle', () => {
            expect(filter.filterProduct(makeBottle({ weinart: 'Wein' }))).toBe(false);
        });
    });

    // -----------------------------------------------------------------
    // filterProduct — Weinfarbe filters
    // -----------------------------------------------------------------

    describe('filterProduct with isRed', () => {
        beforeEach(() => { filter.isRed = true; });

        it('passes a red wine', () => {
            expect(filter.filterProduct(makeBottle({ weinfarbe: 'rot' }))).toBe(true);
        });

        it('blocks a white wine', () => {
            expect(filter.filterProduct(makeBottle({ weinfarbe: 'weiss' }))).toBe(false);
        });

        it('blocks a rosé wine', () => {
            expect(filter.filterProduct(makeBottle({ weinfarbe: 'rose' }))).toBe(false);
        });

        it('passes a bottle with undefined weinfarbe (treated as match)', () => {
            expect(filter.filterProduct(makeBottle({}))).toBe(true);
        });
    });

    describe('filterProduct with isWhite', () => {
        beforeEach(() => { filter.isWhite = true; });

        it('passes a white wine', () => {
            expect(filter.filterProduct(makeBottle({ weinfarbe: 'weiss' }))).toBe(true);
        });

        it('blocks a red wine', () => {
            expect(filter.filterProduct(makeBottle({ weinfarbe: 'rot' }))).toBe(false);
        });
    });

    describe('filterProduct with isRose', () => {
        beforeEach(() => { filter.isRose = true; });

        it('passes a rosé wine', () => {
            expect(filter.filterProduct(makeBottle({ weinfarbe: 'rose' }))).toBe(true);
        });

        it('blocks a red wine', () => {
            expect(filter.filterProduct(makeBottle({ weinfarbe: 'rot' }))).toBe(false);
        });
    });

    // -----------------------------------------------------------------
    // filterProduct — combined filters (AND logic)
    // -----------------------------------------------------------------

    describe('combined filters apply AND logic', () => {
        it('passes only when both weinart and weinfarbe match', () => {
            filter.isSprudel = true;
            filter.isWhite = true;
            expect(filter.filterProduct(makeBottle({ weinart: 'Schaumwein', weinfarbe: 'weiss' }))).toBe(true);
            expect(filter.filterProduct(makeBottle({ weinart: 'Schaumwein', weinfarbe: 'rot' }))).toBe(false);
            expect(filter.filterProduct(makeBottle({ weinart: 'Wein', weinfarbe: 'weiss' }))).toBe(false);
        });

        it('isRed and isSprudel together require rot + Schaumwein', () => {
            filter.isRed = true;
            filter.isSprudel = true;
            expect(filter.filterProduct(makeBottle({ weinart: 'Schaumwein', weinfarbe: 'rot' }))).toBe(true);
            expect(filter.filterProduct(makeBottle({ weinart: 'Wein', weinfarbe: 'rot' }))).toBe(false);
        });
    });

    // -----------------------------------------------------------------
    // filterProduct — text filter
    // -----------------------------------------------------------------

    describe('filterProduct with text filter', () => {
        beforeEach(() => {
            filter.isText = true;
        });

        it('passes when name matches (case-insensitive)', () => {
            filter.textFilter = 'bordeaux';
            expect(filter.filterProduct(makeBottle({ name: 'Château Bordeaux', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
            expect(filter.filterProduct(makeBottle({ name: 'CHÂTEAU BORDEAUX', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
        });

        it('blocks when name does not match and other fields are absent', () => {
            filter.textFilter = 'riesling';
            // bottle has a defined trinkfensterBis so the ternary fallback can be evaluated
            expect(filter.filterProduct(makeBottle({ name: 'Chardonnay', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(false);
        });

        it('passes when traubensorte matches', () => {
            filter.textFilter = 'pinot';
            expect(filter.filterProduct(makeBottle({ traubensorte: 'Pinot Noir', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
        });

        it('passes when alkoholgehalt matches', () => {
            filter.textFilter = '13.5';
            expect(filter.filterProduct(makeBottle({ alkoholgehalt: '13.5%', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
        });

        it('passes when land matches (case-insensitive)', () => {
            filter.textFilter = 'frankreich';
            expect(filter.filterProduct(makeBottle({ land: 'Frankreich', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
        });

        it('passes when region matches (case-insensitive)', () => {
            filter.textFilter = 'burgund';
            expect(filter.filterProduct(makeBottle({ region: 'Burgund', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
        });

        it('passes when trinkfensterBis year <= textFilter year (only when no other fields match)', () => {
            filter.textFilter = '2025';
            const bottle = makeBottle({ trinkfensterBis: new Date(2024, 0, 1) });
            expect(filter.filterProduct(bottle)).toBe(true);
        });

        it('blocks when trinkfensterBis year > textFilter year (and no other fields match)', () => {
            filter.textFilter = '2020';
            const bottle = makeBottle({ trinkfensterBis: new Date(2025, 0, 1) });
            expect(filter.filterProduct(bottle)).toBe(false);
        });

        it('passes any text when textFilter is null', () => {
            filter.textFilter = null;
            expect(filter.filterProduct(makeBottle({ name: 'anything', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
        });

        // Documents the operator-precedence behaviour: because the ternary has lower
        // precedence than ||, a bottle with trinkfensterBis === undefined always
        // satisfies the text filter regardless of the search term.
        it('passes any text filter when trinkfensterBis is undefined (operator precedence)', () => {
            filter.textFilter = 'xyz_no_match';
            const bottle = makeBottle({ name: 'Completely Different Wine' }); // no trinkfensterBis
            expect(filter.filterProduct(bottle)).toBe(true);
        });

        it('combines text filter with weinfarbe filter using AND logic', () => {
            filter.textFilter = 'bordeaux';
            filter.isRed = true;
            expect(filter.filterProduct(makeBottle({ name: 'Bordeaux Rouge', weinfarbe: 'rot', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(true);
            expect(filter.filterProduct(makeBottle({ name: 'Bordeaux Blanc', weinfarbe: 'weiss', trinkfensterBis: new Date(2030, 0, 1) }))).toBe(false);
        });
    });
});
