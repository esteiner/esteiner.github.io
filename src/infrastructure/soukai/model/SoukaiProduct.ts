import type {Relation} from "soukai";
import {type SolidBelongsToOneRelation} from "soukai-solid";
import Model from "./SoukaiProduct.schema";
import type { Product } from "../../../domain/Product/Product";
import {SoukaiOrderItem} from "./SoukaiOrderItem.ts";

export class SoukaiProduct extends Model implements Product {
    static timestamps = false;

    declare public orderItem: SoukaiOrderItem;
    declare public relatedOrderItem: SolidBelongsToOneRelation<SoukaiProduct, SoukaiOrderItem, typeof SoukaiOrderItem>;
    public orderItemRelationship() : Relation {
        return this
            .belongsToOne(SoukaiOrderItem, 'orderItemUrl')
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

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }
}