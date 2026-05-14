import {type SolidBelongsToOneRelation, SolidModel} from "soukai-solid";
import type {Bottle} from "../../../domain/Bottle/Bottle.ts";
import {FieldType, type Relation} from "soukai";
import {SoukaiProduct} from "./SoukaiProduct.ts";

export class SoukaiBottle extends SolidModel implements Bottle {
    static timestamps = false;
    static rdfContexts = { schema: "https://schema.org/" };
    static rdfsClasses = ["schema:ListItem"];
    static fields = {
        cellarUrl: { type: FieldType.Key, rdfProperty: "schema:cellar" },
        subjectOfUrl: { type: FieldType.Key, rdfProperty: "schema:subjectOf" },
        rating: { type: FieldType.Number, rdfProperty: "schema:rating" },
    };

    declare public product: SoukaiProduct;
    declare public relatedProduct: SolidBelongsToOneRelation<SoukaiBottle, SoukaiProduct, typeof SoukaiProduct>;
    public productRelationship() : Relation {
        return this
            .belongsToOne(SoukaiProduct, 'subjectOfUrl')
            .usingSameDocument(true);
    }

    getId(): string {
        return super.getIdAttribute();
    }
    getCellar(): string {
        return this.getAttribute("cellarUrl");
    }
    getProduct(): SoukaiProduct {
        return this.product;
    }
    getPrice(): number {
        return this.getProduct()?.getPrice() ?? 0;
    }
    getPriceCurrency(): string {
        return this.getProduct().getPriceCurrency() ?? "n/a";
    }
    getRating(): number {
        return this.getAttribute("rating");
    }
    setRating(rating: number) {
        this.setAttributeValue("rating", rating);
    }

}