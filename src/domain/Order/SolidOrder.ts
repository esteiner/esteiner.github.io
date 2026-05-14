import type {Relation} from "soukai";
import SolidModel from "./schemas/Order.schema";
import {SolidOrderItem} from "./SolidOrderItem.ts";
import {SolidSeller} from "./SolidSeller.ts";
import type {SolidCustomer} from "./SolidCustomer.ts";

export class SolidOrder extends SolidModel {
    static history = false;

    // relationships can't be defined in schema: https://soukai.js.org/guide/advanced/typescript.html#typescript
    declare public customer?: SolidCustomer;
    declare public seller?: SolidSeller;
    declare public positions?: SolidOrderItem[];

    public customerRelationship() : Relation {
        return this
            .belongsToOne(SolidSeller, 'customerUrl')
            .usingSameDocument(true);
    }

    public sellerRelationship() : Relation {
        return this
            .belongsToOne(SolidSeller, 'sellerUrl')
            .usingSameDocument(true);
    }

    public positionsRelationship() : Relation {
        return this
            .belongsToMany(SolidOrderItem, 'positionUrls')
            .onDelete('cascade')
            .usingSameDocument(true);
    }

}