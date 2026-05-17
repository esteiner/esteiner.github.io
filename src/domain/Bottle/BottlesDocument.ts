import type {Bottle} from "./Bottle.ts";

export interface BottlesDocument {
    getId(): string;
    getBottles(): Bottle[];
    addBottle(bottle: Bottle): void;
    isDirty2(): boolean;
    save(): Promise<this>;
}