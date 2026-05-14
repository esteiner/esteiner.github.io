import type {Product} from "../Product/Product.ts";

export interface Bottle {
    getId(): string;
    getCellar(): string;
    getProduct(): Product;
    getPrice(): number;
    getPriceCurrency(): string;
    getRating(): number;
    setRating(rating: number): void;
}