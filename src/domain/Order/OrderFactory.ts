import type {Order} from "./Order.ts";
import type {OrderItem} from "./OrderItem.ts";
import type {Product} from "../Product/Product.ts";

export interface OrderFactory {

    createOrder(order: Order): Order;
    createOrderItem(orderItem: OrderItem, order: Order): OrderItem

    /**
     * Link an order item to its (already-persisted) product, so the embedded
     * order item references the newly-created local product by URL.
     */
    linkProduct(orderItem: OrderItem, product: Product): void;
}