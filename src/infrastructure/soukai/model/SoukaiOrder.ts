import {SolidModel} from "soukai-solid";
import {FieldType, type Relation} from "soukai";
import type {Seller} from "../../../domain/Order/Seller.ts";
import {SoukaiSeller} from "./SoukaiSeller.ts";
import type {Order} from "../../../domain/Order/Order.ts";
import {SoukaiOrderItem} from "./SoukaiOrderItem.ts";

export class SoukaiOrder extends SolidModel implements Order {
    static timestamps = false;
    static rdfContexts = { schema: "https://schema.org/" };
    static rdfsClasses = ["schema:Order"];
    static fields = {
        orderDate: { type: FieldType.Date, rdfProperty: "schema:orderDate" },
        orderNumber: { type: FieldType.String, rdfProperty: "schema:orderNumber" },
        sellerUrl: { type: FieldType.Key, rdfProperty: "schema:seller" },
    };

    getId(): string {
        return super.getIdAttribute();
    }
    getOrderDate(): Date {
        return this.getAttribute("orderDate");
    }
    getOrderNumber(): string {
        return this.getAttribute("orderNumber");
    }
    getSeller(): Seller | undefined {
        return this.seller;
    }

    declare public seller: SoukaiSeller | undefined;
    public sellerRelationship(): Relation {
        return this.belongsToOne(SoukaiSeller, "sellerUrl");
    }

    declare public positions?: SoukaiOrderItem[];
    public positionsRelationship() : Relation {
        return this
            .belongsToMany(SoukaiOrderItem, 'positionUrls')
            .onDelete('cascade')
            .usingSameDocument(true);
    }

}