import type {Bottle} from "./Bottle.ts";

export interface BottlesStorage {
    getId(): string;
    getBottles(): Bottle[];
    rateBottle(bottleId: string, rating: number): void;
    isModified(): boolean;
    persist(): Promise<this>;
}