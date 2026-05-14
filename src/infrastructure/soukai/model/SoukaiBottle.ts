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
    };

    declare public product: SoukaiProduct;
    declare public relatedProduct: SolidBelongsToOneRelation<SoukaiBottle, SoukaiProduct, typeof SoukaiProduct>;
    public productRelationship() : Relation {
        return this
            .belongsToOne(SoukaiProduct, 'subjectOfUrl')
            .usingSameDocument(true);
    }

    getId(): string {
        return this.id;
    }
    getCellar(): string {
        return this.getAttribute("cellarUrl");
    }
    getProduct(): SoukaiProduct {
        return this.product;
    }
}