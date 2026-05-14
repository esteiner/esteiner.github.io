import type {Product} from "../Product/Product.ts";

export interface Bottle {
    getId(): string;
    getCellar(): string;
    getProduct(): Product;
}