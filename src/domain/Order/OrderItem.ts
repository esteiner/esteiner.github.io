import type {Order} from "./Order.ts";
import type {Product} from "../Product/Product.ts";

export interface OrderItem {
    getId(): string;
    getPrice(): number;
    getPriceCurrency(): string;
    getPriceSource(): string;
    /** The order's seller name; falls back to the price source; otherwise undefined. */
    getSellerName(): string | undefined;
    getOrderQuantity(): number;
    getOrder(): Order;
    getProduct(): Product
}