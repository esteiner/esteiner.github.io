import type {Relation} from "soukai";
import Model from "./schemas/OrderItem.schema";
import {Product} from "./../Product/Product.ts";

export class OrderItem extends Model {

    declare public product: Product;

    public productRelationship() : Relation {
        return this
            .belongsToOne(Product, 'productUrl')
            .usingSameDocument(true);
    }
}