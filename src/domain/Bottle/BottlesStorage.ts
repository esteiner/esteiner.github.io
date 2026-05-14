import type {Bottle} from "./Bottle.ts";

export interface BottlesStorage {
    getId(): string;
    getBottles(): Bottle[];
}