import type {Relation} from "soukai";
import Model from "./SoukaiOrder.schema";
import type {Seller} from "../../../domain/Order/Seller.ts";
import {SoukaiSeller} from "./SoukaiSeller.ts";
import type {Order} from "../../../domain/Order/Order.ts";
import {SoukaiOrderItem} from "./SoukaiOrderItem.ts";
import type {OrderItem} from "../../../domain/Order/OrderItem.ts";
import type {SolidBelongsToOneRelation} from "soukai-solid";

export class SoukaiOrder extends Model implements Order {
    static history = false;
    static timestamps = false;

    declare public seller: SoukaiSeller | undefined;
    declare public relatedSeller: SolidBelongsToOneRelation<SoukaiOrder, SoukaiSeller, typeof SoukaiSeller>;
    public sellerRelationship(): Relation {
        return this
            .belongsToOne(SoukaiSeller, "sellerUrl")
            .usingSameDocument(true);;
    }

    declare public positions?: SoukaiOrderItem[];
    public positionsRelationship() : Relation {
        return this
            .belongsToMany(SoukaiOrderItem, 'positionUrls')
            .onDelete('cascade')
            .usingSameDocument(true);
    }

    getId(): string {
        return super.getIdAttribute();
    }
    getOrderDate(): Date {
        return this.orUndefined(this.orderDate);
    }
    getOrderNumber(): string {
        return this.orUndefined(this.orderNumber);
    }
    getSeller(): Seller | undefined {
        return this.seller;
    }
    getOrderItems(): SoukaiOrderItem[] {
        if (this.positions) {
            return this.positions;
        }
        return [];
    }
    addOrderItem(orderItem: OrderItem): Order {
        if (orderItem instanceof SoukaiOrderItem) {
            this.positions?.push(orderItem);
        }
        return this;
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }
}