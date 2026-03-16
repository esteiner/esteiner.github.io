import { describe, it, expect } from 'vitest';
import { Weinfarbe } from './Weinfarbe';

describe('Weinfarbe', () => {

    describe('toString', () => {
        it('returns "rot" for Rot', () => {
            expect(Weinfarbe.Rot.toString()).toBe('rot');
        });

        it('returns "weiss" for Weiss', () => {
            expect(Weinfarbe.Weiss.toString()).toBe('weiss');
        });

        it('returns "rose" for Rose', () => {
            expect(Weinfarbe.Rose.toString()).toBe('rose');
        });
    });

    describe('equals', () => {
        it('returns true when weinfarbe is undefined', () => {
            expect(Weinfarbe.Rot.equals(undefined)).toBe(true);
            expect(Weinfarbe.Weiss.equals(undefined)).toBe(true);
            expect(Weinfarbe.Rose.equals(undefined)).toBe(true);
        });

        it('returns true when the string matches', () => {
            expect(Weinfarbe.Rot.equals('rot')).toBe(true);
            expect(Weinfarbe.Weiss.equals('weiss')).toBe(true);
            expect(Weinfarbe.Rose.equals('rose')).toBe(true);
        });

        it('returns false when the string does not match', () => {
            expect(Weinfarbe.Rot.equals('weiss')).toBe(false);
            expect(Weinfarbe.Rot.equals('rose')).toBe(false);
            expect(Weinfarbe.Weiss.equals('rot')).toBe(false);
            expect(Weinfarbe.Weiss.equals('rose')).toBe(false);
            expect(Weinfarbe.Rose.equals('rot')).toBe(false);
            expect(Weinfarbe.Rose.equals('weiss')).toBe(false);
        });

        it('is case-sensitive', () => {
            expect(Weinfarbe.Rot.equals('Rot')).toBe(false);
            expect(Weinfarbe.Weiss.equals('Weiss')).toBe(false);
        });
    });
});
