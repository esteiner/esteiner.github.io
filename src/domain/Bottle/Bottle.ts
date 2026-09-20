import type {Product} from "../Product/Product.ts";
import type {Rating} from "../Product/Rating.ts";

export interface Bottle {
    // getter
    getId(): string;
    getCellar(): string;
    getProduct(): Product;
    getPrice(): number;
    getPriceCurrency(): string;
    getRating(): Rating | undefined;
    // setter
    setCellar(cellarId: string): void;
    setRating(value: number): void;
}
