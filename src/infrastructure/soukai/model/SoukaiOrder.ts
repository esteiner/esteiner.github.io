import type {Relation} from "soukai";
import Model from "./SoukaiOrder.schema";
import type {Seller} from "../../../domain/Order/Seller.ts";
import {SoukaiSeller} from "./SoukaiSeller.ts";
import type {Customer} from "../../../domain/Order/Customer.ts";
import {SoukaiCustomer} from "./SoukaiCustomer.ts";
import type {Order} from "../../../domain/Order/Order.ts";
import {SoukaiOrderItem} from "./SoukaiOrderItem.ts";
import type {OrderItem} from "../../../domain/Order/OrderItem.ts";
import type {SolidBelongsToOneRelation} from "soukai-solid";

export class SoukaiOrder extends Model implements Order {

    declare public seller: SoukaiSeller | undefined;
    declare public relatedSeller: SolidBelongsToOneRelation<SoukaiOrder, SoukaiSeller, typeof SoukaiSeller>;
    public sellerRelationship(): Relation {
        return this
            .belongsToOne(SoukaiSeller, "sellerUrl")
            .usingSameDocument(true);;
    }

    declare public customer: SoukaiCustomer | undefined;
    declare public relatedCustomer: SolidBelongsToOneRelation<SoukaiOrder, SoukaiCustomer, typeof SoukaiCustomer>;
    public customerRelationship(): Relation {
        return this
            .belongsToOne(SoukaiCustomer, "customerUrl")
            .usingSameDocument(true);
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
    getCustomer(): Customer | undefined {
        return this.customer;
    }
    getOrderItems(): SoukaiOrderItem[] {
        if (this.positions) {
            return this.positions;
        }
        return [];
    }
    addOrderItem(orderItem: OrderItem): Order {
        if (orderItem instanceof SoukaiOrderItem) {
            // Assign through the relation setter (a freshly-built order has no
            // loaded `positions`, so a plain push would be a no-op and the items
            // would not be embedded in the order document on save).
            this.positions = [...(this.positions ?? []), orderItem];
        }
        return this;
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }
}

// Local-first: retain the operation log and propagate deletions across devices.
// Seller and OrderItems stay embedded in the Order document (see relationships).
SoukaiOrder.useSoftDeletes(true);