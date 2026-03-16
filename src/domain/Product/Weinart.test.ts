import { describe, it, expect } from 'vitest';
import { Weinart } from './Weinart';

describe('Weinart', () => {

    describe('toString', () => {
        it('returns "Wein" for Wein', () => {
            expect(Weinart.Wein.toString()).toBe('Wein');
        });

        it('returns "Schaumwein" for Schaumwein', () => {
            expect(Weinart.Schaumwein.toString()).toBe('Schaumwein');
        });

        it('returns "Dessertwein" for Dessertwein', () => {
            expect(Weinart.Dessertwein.toString()).toBe('Dessertwein');
        });
    });

    describe('equals', () => {
        it('returns true when weinart is undefined', () => {
            expect(Weinart.Wein.equals(undefined)).toBe(true);
            expect(Weinart.Schaumwein.equals(undefined)).toBe(true);
            expect(Weinart.Dessertwein.equals(undefined)).toBe(true);
        });

        it('returns true when the string matches', () => {
            expect(Weinart.Wein.equals('Wein')).toBe(true);
            expect(Weinart.Schaumwein.equals('Schaumwein')).toBe(true);
            expect(Weinart.Dessertwein.equals('Dessertwein')).toBe(true);
        });

        it('returns false when the string does not match', () => {
            expect(Weinart.Wein.equals('Schaumwein')).toBe(false);
            expect(Weinart.Wein.equals('Dessertwein')).toBe(false);
            expect(Weinart.Schaumwein.equals('Wein')).toBe(false);
            expect(Weinart.Schaumwein.equals('Dessertwein')).toBe(false);
            expect(Weinart.Dessertwein.equals('Wein')).toBe(false);
        });

        it('is case-sensitive', () => {
            expect(Weinart.Wein.equals('wein')).toBe(false);
            expect(Weinart.Schaumwein.equals('schaumwein')).toBe(false);
        });
    });
});
