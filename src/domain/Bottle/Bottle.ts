import type {Product} from "../Product/Product.ts";
import type {Rating} from "../Product/Rating.ts";

export interface Bottle {
    // getter
    getId(): string;
    getCellar(): string;
    getProduct(): Product;
    getRating(): Rating | undefined;
    /** When the bottle was moved to Altglass, if recorded. */
    getDisposedAt(): Date | undefined;
    /**
     * Best known disposal date: the stored one, else the rating date, else the
     * last modification (for bottles disposed before the date was recorded).
     */
    getEffectiveDisposalDate(): Date | undefined;
    // setter
    setCellar(cellarId: string): void;
    setRating(value: number): void;
    setDisposedAt(date: Date): void;
}
