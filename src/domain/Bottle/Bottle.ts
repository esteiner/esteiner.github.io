import type {Product} from "../Product/Product.ts";

export interface Bottle {
    // getter
    getId(): string;
    getCellar(): string;
    getProduct(): Product;
    getPrice(): number;
    getPriceCurrency(): string;
    // setter
    setCellar(cellarId: string): void;
}
