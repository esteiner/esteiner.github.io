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
    // setters — for inline editing of a product's own detail fields
    setName(name: string): void;
    setProducer(producer: string): void;
    setWineName(wineName: string): void;
    setProductionDate(date: Date | undefined): void;
    setPrice(price: number): void;
    setVolumeMl(volumeMl: number): void;
    setRegion(region: string): void;
    setCountry(country: string): void;
    setGrapeVariety(grapeVariety: string): void;
    setWineType(wineType: string): void;
    setWineColor(wineColor: string): void;
    setAlcoholContent(alcoholContent: string): void;
    setProduction(production: string): void;
    setOrganic(organic: string): void;
    setClassification(classification: string): void;
    setDrinkingWindowFrom(date: Date | undefined): void;
    setDrinkingWindowTo(date: Date | undefined): void;
}
