import Model from "./schemas/Product.schema";
import {SolidOrderItem} from "../Order/SolidOrderItem.ts";
import type {Relation} from "soukai";
import type {SolidBelongsToOneRelation} from "soukai-solid";

export class SolidProduct extends Model {
    static history = false;

    declare public orderItem: SolidOrderItem;
    declare public relatedOrderItem: SolidBelongsToOneRelation<
        SolidProduct,
        SolidOrderItem,
        typeof SolidOrderItem
    >;

    public orderItemRelationship() : Relation {
        return this
            .belongsToOne(SolidOrderItem, 'orderItemUrl')
            .usingSameDocument(true);
    }

}