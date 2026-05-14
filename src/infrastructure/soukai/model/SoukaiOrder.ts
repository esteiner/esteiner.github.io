import {SolidModel} from "soukai-solid";
import {FieldType, type Relation} from "soukai";
import type {SellerModel} from "../../../domain/Order/SellerModel.ts";
import {SoukaiSeller} from "./SoukaiSeller.ts";
import type {OrderModel} from "../../../domain/Order/OrderModel.ts";
import {SoukaiOrderItem} from "./SoukaiOrderItem.ts";

export class SoukaiOrder extends SolidModel implements OrderModel {
    static timestamps = false;
    static rdfContexts = { schema: "https://schema.org/" };
    static rdfsClasses = ["schema:Order"];
    static fields = {
        orderDate: { type: FieldType.String, rdfProperty: "schema:orderDate" },
        orderNumber: { type: FieldType.String, rdfProperty: "schema:orderNumber" },
        sellerUrl: { type: FieldType.Key, rdfProperty: "schema:seller" },
    };

    getId(): string {
        return super.getIdAttribute();
    }
    getOrderDate(): string {
        return this.getAttribute("orderDate");
    }
    getOrderNumber(): string {
        return this.getAttribute("orderNumber");
    }
    getSeller(): SellerModel | undefined {
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