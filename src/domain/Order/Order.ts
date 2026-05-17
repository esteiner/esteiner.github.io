import type {Seller} from "./Seller.ts";
import type {OrderItem} from "./OrderItem.ts";

export interface Order {
    getId(): string;
    getOrderDate(): Date;
    getOrderNumber(): string;
    getSeller(): Seller | undefined;
    getOrderItems(): OrderItem[];
    addOrderItem(orderItem: OrderItem): Order;
}