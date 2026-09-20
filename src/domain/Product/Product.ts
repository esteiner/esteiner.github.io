import type {OrderItem} from "../Order/OrderItem.ts";
import type {Rating} from "./Rating.ts";

export interface Product {
    getId(): string;
    getName(): string;
    getWineName(): string;
    getProductionDate(): Date | undefined;
    getPrice(): number;
    getPriceCurrency(): string;
    getProducer(): string;
    getCountry(): string;
    getVolumeMl(): number;
    getRegion(): string;
    getGrapeVariety(): string;
    getWineType(): string;
    getWineColor(): string;
    getAlcoholContent(): string;
    getProduction(): string;
    getOrganic(): string;
    getClassification(): string;
    getDrinkingWindowFrom(): Date;
    getDrinkingWindowTo(): Date;
    getOrderItem(): OrderItem;
    getRatings(): Rating[];
    /**
     * @deprecated Ratings are now stored per bottle via {@link Bottle.setRating}.
     * Retained for backward compatibility with existing product-level rating
     * arrays; new code SHOULD NOT add ratings to the product.
     */
    createRating(value: number): Rating;
}
