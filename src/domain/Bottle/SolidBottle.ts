import type {Relation} from "soukai";
import Model from "./schemas/Bottle.schema";
import {SolidProduct} from "../Product/SolidProduct.ts";
import type {SolidBelongsToOneRelation} from "soukai-solid";

export class SolidBottle extends Model {
    static history = false;

    declare public product: SolidProduct;
    declare public relatedProduct: SolidBelongsToOneRelation<
        SolidBottle,
        SolidProduct,
        typeof SolidProduct
    >;
    // declare public cellar: Cellar;

    public productRelationship() : Relation {
        return this
            .belongsToOne(SolidProduct, 'productUrl')
            .usingSameDocument(true);
    }

    public getPrice(): number | undefined {
        return this.product?.price ?? this.price;
    }

    public getPriceCurrency(): string | undefined {
        return this.product?.priceCurrency ?? this.priceCurrency;
    }

    // public cellarRelationship() : Relation {
    //     return this
    //         .belongsToOne(Cellar, 'cellarUrl')
    //         .usingSameDocument(false);
    // }

}

// belongsToOne := Creates a relation when this model references one instance of another model.
// hasOne := Creates a relation when this model is referenced by one instance of another model.