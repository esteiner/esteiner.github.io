import Model from "./schemas/Product.schema";
import {OrderItem} from "../Order/OrderItem.ts";
import type {Relation} from "soukai";
import type {SolidBelongsToOneRelation} from "soukai-solid";

export class Product extends Model {
    static history = false;

    declare public orderItem: OrderItem;
    declare public relatedOrderItem: SolidBelongsToOneRelation<
        Product,
        OrderItem,
        typeof OrderItem
    >;

    public orderItemRelationship() : Relation {
        return this
            .belongsToOne(OrderItem, 'orderItemUrl')
            .usingSameDocument(true);
    }

}