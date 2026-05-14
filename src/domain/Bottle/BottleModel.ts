import type {ProductModel} from "../Product/ProductModel.ts";

export interface BottleModel {
    getId(): string;
    getCellar(): string;
    getProduct(): ProductModel;
}