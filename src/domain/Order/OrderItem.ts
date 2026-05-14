import type {Order} from "./Order.ts";

export interface OrderItem {
    getId(): string;
    getPrice(): number;
    getPriceCurrency(): string;
    getOrderQuantity(): number;
    getOrder(): Order;
}