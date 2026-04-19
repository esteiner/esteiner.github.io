import Model from "./schemas/OrderItem.schema";
import {Order} from "./Order.ts";
import {Product} from "./../Product/Product.ts";
import type {Relation} from "soukai";
import type {SolidBelongsToOneRelation} from "soukai-solid";

export class OrderItem extends Model {

    declare public order: Order;
    declare public product: Product;

    public productRelationship() : Relation {
        return this
            .belongsToOne(Product, 'productUrl')
            .usingSameDocument(true);
    }

    declare public relatedOrder: SolidBelongsToOneRelation<
        OrderItem,
        Order,
        typeof Order
    >;

    public orderRelationship() : Relation {
        return this
            .belongsToOne(Order, 'orderUrl')
            .usingSameDocument(true);
    }
}