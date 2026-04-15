import Model from "./schemas/Product.schema";
import {Order} from "../Order/Order.ts";
import type {Relation} from "soukai";
import type {SolidBelongsToOneRelation} from "soukai-solid";

export class Product extends Model {
    static history = false;

    declare public order: Order;
    declare public relatedOrder: SolidBelongsToOneRelation<
        Product,
        Order,
        typeof Order
    >;

    public orderRelationship() : Relation {
        return this
            .belongsToOne(Order, 'orderUrl')
            .usingSameDocument(true);
    }

}