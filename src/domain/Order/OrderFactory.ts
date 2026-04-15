import {Order} from "./Order.ts";

export class OrderFactory {

    public createOrder(order: Order): Order {
        const newOrder: Order = new Order();
        newOrder.orderDate = order.orderDate;
        newOrder.seller = order.seller;
        return newOrder;
    }

}