import type {Order} from "./Order.ts";
import type {OrderItem} from "./OrderItem.ts";

export interface OrderFactory {

    createOrder(order: Order): Order;
    createOrderItem(orderItem: OrderItem, order: Order): OrderItem
}