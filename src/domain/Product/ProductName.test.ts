import { describe, it, expect } from 'vitest';
import { bottleSizeSuffix, composeProductName } from './ProductName';

describe('ProductName', () => {

    describe('bottleSizeSuffix', () => {
        it('has no suffix for a standard 750 ml bottle', () => {
            expect(bottleSizeSuffix(750)).toBeUndefined();
        });

        it('has no suffix without a volume', () => {
            expect(bottleSizeSuffix(undefined)).toBeUndefined();
        });

        it('has no suffix for an invalid volume', () => {
            expect(bottleSizeSuffix(0)).toBeUndefined();
            expect(bottleSizeSuffix(Number.NaN)).toBeUndefined();
        });

        it('returns "(1.5l)" for 1500 ml', () => {
            expect(bottleSizeSuffix(1500)).toBe('(1.5l)');
        });

        it('returns "(3l)" for 3000 ml', () => {
            expect(bottleSizeSuffix(3000)).toBe('(3l)');
        });

        it('returns "(0.375l)" for 375 ml', () => {
            expect(bottleSizeSuffix(375)).toBe('(0.375l)');
        });

        it('returns "(0.5l)" for 500 ml', () => {
            expect(bottleSizeSuffix(500)).toBe('(0.5l)');
        });
    });

    describe('composeProductName', () => {
        it('joins Hersteller, Weinname and Jahrgang for a standard bottle', () => {
            expect(composeProductName('Gaja', 'Barbaresco', 2019, 750)).toBe('Gaja Barbaresco 2019');
        });

        it('appends the size suffix for a magnum', () => {
            expect(composeProductName('Gaja', 'Barbaresco', 2019, 1500)).toBe('Gaja Barbaresco 2019 (1.5l)');
        });

        it('omits missing parts without extra separators', () => {
            expect(composeProductName('Gaja', undefined, undefined, 3000)).toBe('Gaja (3l)');
            expect(composeProductName('', '  ', 2019, undefined)).toBe('2019');
        });

        it('returns an empty name when every part is missing', () => {
            expect(composeProductName(undefined, undefined, undefined, 750)).toBe('');
        });
    });
});
