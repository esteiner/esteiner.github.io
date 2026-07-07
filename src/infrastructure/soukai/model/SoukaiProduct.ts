import type {Relation} from "soukai";
import {type SolidBelongsToManyRelation, type SolidBelongsToOneRelation} from "soukai-solid";
import Model from "./SoukaiProduct.schema";
import type { Product } from "../../../domain/Product/Product";
import type {Rating} from "../../../domain/Product/Rating.ts";
import {SoukaiOrderItem} from "./SoukaiOrderItem.ts";
import {SoukaiRating} from "./SoukaiRating.ts";

export class SoukaiProduct extends Model implements Product {

    declare public orderItem: SoukaiOrderItem;
    declare public relatedOrderItem: SolidBelongsToOneRelation<SoukaiProduct, SoukaiOrderItem, typeof SoukaiOrderItem>;
    // Per-resource: the OrderItem lives embedded in its Order document, so from a
    // Product it is a cross-document reference by URL.
    public orderItemRelationship() : Relation {
        return this
            .belongsToOne(SoukaiOrderItem, 'orderItemUrl');
    }

    declare public ratings: SoukaiRating[];
    declare public relatedRatings: SolidBelongsToManyRelation<SoukaiProduct, SoukaiRating, typeof SoukaiRating>;
    // Ratings are owned by exactly one Product and never referenced elsewhere, so
    // they stay embedded in the Product's document.
    public ratingsRelationship() : Relation {
        return this
            .belongsToMany(SoukaiRating, 'ratingUrls')
            .usingSameDocument(true);
    }

    getId(): string {
        return this.id;
    }
    getName(): string {
        return this.orUndefined(this.name);
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
        if (!this.ratings) {
            this.ratings = [];
        }
        this.ratings.push(rating);
        return rating;
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }
}

// Local-first: retain the operation log and propagate deletions across devices.
SoukaiProduct.useSoftDeletes(true);
