import type {BelongsToManyRelation, BelongsToOneRelation} from "soukai-bis";
import Model from "./SoukaiOrder.schema";
import type {Seller} from "../../../domain/Order/Seller.ts";
import {SoukaiSeller} from "./SoukaiSeller.ts";
import type {Customer} from "../../../domain/Order/Customer.ts";
import {SoukaiCustomer} from "./SoukaiCustomer.ts";
import type {Order} from "../../../domain/Order/Order.ts";
import {SoukaiOrderItem} from "./SoukaiOrderItem.ts";
import type {OrderItem} from "../../../domain/Order/OrderItem.ts";

export class SoukaiOrder extends Model implements Order {

    // Relation wiring lives in SoukaiOrder.schema.ts. Seller, customer and order
    // items stay embedded in the Order document (usingSameDocument).
    declare public seller: SoukaiSeller | undefined;
    declare public relatedSeller: BelongsToOneRelation<this, SoukaiSeller, typeof SoukaiSeller>;

    declare public customer: SoukaiCustomer | undefined;
    declare public relatedCustomer: BelongsToOneRelation<this, SoukaiCustomer, typeof SoukaiCustomer>;

    declare public positions?: SoukaiOrderItem[];
    declare public relatedPositions: BelongsToManyRelation<this, SoukaiOrderItem, typeof SoukaiOrderItem>;

    /**
     * URL of the Pod inbox document this order was read from. Transient — set at
     * inbox-read time and consumed by `deleteFromInbox`; NOT a persisted model
     * attribute. Carried per-order (rather than in shared repository state) so
     * deletion resolves the correct document even when another inbox read
     * overlaps an in-flight ingestion.
     *
     * The `= undefined` initializer is REQUIRED: SoukaiOrder extends soukai-bis'
     * MagicObject, whose proxy routes assignments to non-schema, non-reserved
     * properties into `setAttribute` — which silently drops them. Only
     * properties present as own-properties on a freshly-constructed instance are
     * treated as reserved (plain) fields. With `useDefineForClassFields: false`,
     * an initializer is what makes this field an own-property, so `= undefined`
     * (not a bare declaration) is what lets the setter/getter actually persist.
     */
    private inboxSourceUrl?: string = undefined;

    setInboxSourceUrl(url: string): void {
        this.inboxSourceUrl = url;
    }

    getInboxSourceUrl(): string | undefined {
        return this.inboxSourceUrl;
    }

    getId(): string {
        return this.url as string;
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
            // Attach through the relation so the item is embedded in the order
            // document on save (a plain attribute assignment does not register
            // the related model with soukai-bis).
            this.relatedPositions.addRelated(orderItem);
        }
        return this;
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }
}
