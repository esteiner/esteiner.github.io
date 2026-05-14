import type {Bottle} from "./Bottle.ts";

export interface BottlesStorage {
    getId(): string;
    getBottles(): Bottle[];
    rateBottle(bottleId: string, rating: number): void;
    isModified(): boolean;
    transferBottle(bottle: Bottle, cellarId: string): void;
}