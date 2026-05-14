import type {OrderItemModel} from "../Order/OrderItemModel.ts";

export interface ProductModel {
    getId(): string;
    getName(): string;
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
    getDrinkingWindowFrom(): string;
    getDrinkingWindowTo(): string;
    getOrderItem(): OrderItemModel;
}