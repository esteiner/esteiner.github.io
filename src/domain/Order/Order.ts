import type {Relation} from "soukai";
import SolidModel from "./schemas/Order.schema";
import {OrderItem} from "./OrderItem.ts";
import {Seller} from "./Seller.ts";
import type {Customer} from "./Customer.ts";

export class Order extends SolidModel {

    // relationships can't be defined in schema: https://soukai.js.org/guide/advanced/typescript.html#typescript
    declare public customer?: Customer;
    declare public seller?: Seller;
    declare public positions?: OrderItem[];

    public customerRelationship() : Relation {
        return this
            .belongsToOne(Seller, 'customerUrl')
            .usingSameDocument(true);
    }

    public sellerRelationship() : Relation {
        return this
            .belongsToOne(Seller, 'sellerUrl')
            .usingSameDocument(true);
    }

    public positionsRelationship() : Relation {
        return this
            .belongsToMany(OrderItem, 'positionUrls')
            .onDelete('cascade')
            .usingSameDocument(true);
    }

}