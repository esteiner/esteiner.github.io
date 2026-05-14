import {type SolidBelongsToOneRelation, SolidModel} from "soukai-solid";
import type { Product } from "../../../domain/Product/Product";
import {FieldType, type Relation} from "soukai";
import {SoukaiOrderItem} from "./SoukaiOrderItem.ts";

export class SoukaiProduct extends SolidModel implements Product {
    static timestamps = false;
    static rdfContexts = {
        schema: "https://schema.org/",
        wine: "https://vocab.kellermeister.ch/wine/",
    };
    static rdfsClasses = ["schema:Product"];
    static fields = {
        name: { type: FieldType.String, rdfProperty: "schema:name" },
        productionDate: { type: FieldType.Date, rdfProperty: "schema:name" },
        price: { type: FieldType.Number, rdfProperty: "schema:price" },
        priceCurrency: { type: FieldType.String, rdfProperty: "schema:priceCurrency" },
        producer: { type: FieldType.String, rdfProperty: "wine:hersteller" },
        country: { type: FieldType.String, rdfProperty: "wine:land" },
        volumeMl: { type: FieldType.Number, rdfProperty: "wine:milliliter" },
        region: { type: FieldType.String, rdfProperty: "wine:region" },
        grapeVariety: { type: FieldType.String, rdfProperty: "wine:traubensorte" },
        wineType: { type: FieldType.String, rdfProperty: "wine:weinart" },
        wineColor: { type: FieldType.String, rdfProperty: "wine:weinfarbe" },
        alcoholContent: { type: FieldType.String, rdfProperty: "wine:alkoholgehalt" },
        production: { type: FieldType.String, rdfProperty: "wine:ausbau" },
        organic: { type: FieldType.String, rdfProperty: "wine:biologisch" },
        classification: { type: FieldType.String, rdfProperty: "wine:klassifikation" },
        drinkingWindowFrom: { type: FieldType.Date, rdfProperty: "wine:trinkfensterVon" },
        drinkingWindowTo: { type: FieldType.Date, rdfProperty: "wine:trinkfensterBis" },
        orderItemUrl: { type: FieldType.Key, rdfProperty: "wine:orderItem" },
    };

    declare public orderItem: SoukaiOrderItem;
    declare public relatedOrderItem: SolidBelongsToOneRelation<SoukaiProduct, SoukaiOrderItem, typeof SoukaiOrderItem>;
    public orderItemRelationship() : Relation {
        return this
            .belongsToOne(SoukaiOrderItem, 'orderItemUrl')
            .usingSameDocument(true);
    }

    getId(): string {
        return super.getIdAttribute();
    }
    getName(): string {
        return this.getAttribute("name");
    }
    getProductionDate(): Date {
        return this.getAttribute("productionDate");
    }
    getPrice(): number {
        return this.getAttribute("price");
    }
    getPriceCurrency(): string {
        return this.getAttribute("priceCurrency");
    }
    getProducer(): string {
        return this.getAttribute("producer");
    }
    getCountry(): string {
        return this.getAttribute("country");
    }
    getVolumeMl(): number {
        return this.getAttribute("volumeMl");
    }
    getRegion(): string {
        return this.getAttribute("region");
    }
    getGrapeVariety(): string {
        return this.getAttribute("grapeVariety");
    }
    getWineType(): string {
        return this.getAttribute("wineType");
    }
    getWineColor(): string {
        return this.getAttribute("wineColor");
    }
    getAlcoholContent(): string {
        return this.getAttribute("alcoholContent");
    }
    getProduction(): string {
        return this.getAttribute("production");
    }
    getOrganic(): string {
        return this.getAttribute("organic");
    }
    getClassification(): string {
        return this.getAttribute("classification");
    }
    getDrinkingWindowFrom(): Date {
        return this.getAttribute("drinkingWindowFrom");
    }
    getDrinkingWindowTo(): Date {
        return this.getAttribute("drinkingWindowTo");
    }
    getOrderItem(): SoukaiOrderItem {
        return this.orderItem;
    }
}