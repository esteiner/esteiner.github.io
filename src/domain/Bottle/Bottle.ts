import type {Relation} from "soukai";
import Model from "./schemas/Bottle.schema";
import {Product} from "../Product/Product.ts";
import type {SolidBelongsToOneRelation} from "soukai-solid";

export class Bottle extends Model {
    static history = false;

    // initialize(attributes: Attributes, exists: boolean, product: Product) {
    //     super.initialize(attributes, exists);
    //     this.getRelation('product')?.attach(product);
    // }

    declare public product: Product;
    declare public relatedProduct: SolidBelongsToOneRelation<
        Bottle,
        Product,
        typeof Product
    >;
    // declare public cellar: Cellar;

    public productRelationship() : Relation {
        return this
            .belongsToOne(Product, 'productUrl')
            .usingSameDocument(true);
    }

    // public cellarRelationship() : Relation {
    //     return this
    //         .belongsToOne(Cellar, 'cellarUrl')
    //         .usingSameDocument(false);
    // }

}

// belongsToOne := Creates a relation when this model references one instance of another model.
// hasOne := Creates a relation when this model is referenced by one instance of another model.