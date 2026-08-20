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
    createRating(value: number): Rating;
}
