import type {Order} from "./Order.ts";
import type {Product} from "../Product/Product.ts";

export interface OrderItem {
    getId(): string;
    getPrice(): number;
    getPriceCurrency(): string;
    getOrderQuantity(): number;
    getOrder(): Order;
    getProduct(): Product
}