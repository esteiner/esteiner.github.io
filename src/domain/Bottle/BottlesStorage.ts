import type {BottleModel} from "./BottleModel.ts";

export interface BottlesStorage {
    getId(): string;
    getBottles(): BottleModel[];
}