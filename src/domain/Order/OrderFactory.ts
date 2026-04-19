import {Order} from "./Order";
import {Seller} from "./Seller";
import {OrderItem} from "./OrderItem";

export class OrderFactory {

    public createOrder(order: Order): Order {
        const newOrder: Order = new Order();
        newOrder.orderDate = order.orderDate;
        newOrder.orderNumber = order.orderNumber;

        if (order.seller) {
            const newSeller = new Seller();
            newSeller.name = order.seller.name;
            newSeller.email = order.seller.email;
            newSeller.url = order.seller.url;
            newOrder.seller = newSeller;
        }
        return newOrder;
    }

    public createOrderItem(orderItem: OrderItem, order: Order): OrderItem {
        const newOrderItem = new OrderItem();
        newOrderItem.orderQuantity = orderItem.orderQuantity;
        newOrderItem.price = orderItem.price;
        newOrderItem.priceCurrency = orderItem.priceCurrency;
        newOrderItem.relatedOrder.addRelated(order);
        return newOrderItem;
    }


}