import Model from "./schemas/OrderItem.schema";
import {SolidOrder} from "./SolidOrder.ts";
import {SolidProduct} from "../Product/SolidProduct.ts";
import type {Relation} from "soukai";
import type {SolidBelongsToOneRelation} from "soukai-solid";

export class SolidOrderItem extends Model {
    static history = false;

    declare public order: SolidOrder;
    declare public product: SolidProduct;

    public productRelationship() : Relation {
        return this
            .belongsToOne(SolidProduct, 'productUrl')
            .usingSameDocument(true);
    }

    declare public relatedOrder: SolidBelongsToOneRelation<
        SolidOrderItem,
        SolidOrder,
        typeof SolidOrder
    >;

    public orderRelationship() : Relation {
        return this
            .belongsToOne(SolidOrder, 'orderUrl')
            .usingSameDocument(true);
    }
}