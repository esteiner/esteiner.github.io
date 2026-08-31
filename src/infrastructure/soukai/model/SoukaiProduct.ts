import type {BelongsToManyRelation, BelongsToOneRelation} from "soukai-bis";
import Model from "./SoukaiProduct.schema";
import type { Product } from "../../../domain/Product/Product";
import type {Rating} from "../../../domain/Product/Rating.ts";
import {SoukaiOrderItem} from "./SoukaiOrderItem.ts";
import {SoukaiRating} from "./SoukaiRating.ts";

export class SoukaiProduct extends Model implements Product {

    // Relation wiring lives in SoukaiProduct.schema.ts.
    declare public orderItem: SoukaiOrderItem;
    declare public relatedOrderItem: BelongsToOneRelation<this, SoukaiOrderItem, typeof SoukaiOrderItem>;

    declare public ratings: SoukaiRating[];
    declare public relatedRatings: BelongsToManyRelation<this, SoukaiRating, typeof SoukaiRating>;

    getId(): string {
        return this.url as string;
    }
    getName(): string {
        return this.orUndefined(this.name);
    }
    getWineName(): string {
        return this.orUndefined(this.weinname);
    }
    getProductionDate(): Date | undefined {
        return this.productionDate ? this.productionDate : undefined;
    }
    getPrice(): number {
        return this.orUndefined(this.price);
    }
    getPriceCurrency(): string {
        return this.orUndefined(this.priceCurrency);
    }
    getProducer(): string {
        return this.orUndefined(this.hersteller);
    }
    getCountry(): string {
        return this.orUndefined(this.land);
    }
    getVolumeMl(): number {
        return this.orUndefined(this.milliliter);
    }
    getRegion(): string {
        return this.orUndefined(this.region);
    }
    getGrapeVariety(): string {
        return this.orUndefined(this.traubensorte);
    }
    getWineType(): string {
        return this.orUndefined(this.weinart);
    }
    getWineColor(): string {
        return this.orUndefined(this.weinfarbe);
    }
    getAlcoholContent(): string {
        return this.orUndefined(this.alkoholgehalt);
    }
    getProduction(): string {
        return this.orUndefined(this.ausbau);
    }
    getOrganic(): string {
        return this.orUndefined(this.biologisch);
    }
    getClassification(): string {
        return this.orUndefined(this.klassifikation);
    }
    getDrinkingWindowFrom(): Date {
        return this.orUndefined(this.trinkfensterVon);
    }
    getDrinkingWindowTo(): Date {
        return this.orUndefined(this.trinkfensterBis);
    }
    getOrderItem(): SoukaiOrderItem {
        return this.orderItem;
    }
    getRatings(): Rating[] {
        return this.ratings ?? [];
    }
    createRating(value: number): SoukaiRating {
        const rating: SoukaiRating = new SoukaiRating();
        rating.value = value;
        rating.date = new Date();
        // Attach through the relation so the rating is embedded in the product
        // document on save (a plain array push does not register it with bis).
        this.relatedRatings.addRelated(rating);
        return rating;
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }
}
