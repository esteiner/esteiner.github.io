import type {OrderFactory} from "../../../domain/Order/OrderFactory.ts";
import type {Order} from "../../../domain/Order/Order.ts";
import type {OrderItem} from "../../../domain/Order/OrderItem.ts";
import {SoukaiOrder} from "./SoukaiOrder.ts";
import {SoukaiOrderItem} from "./SoukaiOrderItem.ts";
import {SoukaiSeller} from "./SoukaiSeller.ts";

export class SoukaiOrderFactory implements OrderFactory {

    createOrder(order: Order): Order {
        const newOrder = new SoukaiOrder();
        newOrder.orderDate = order.getOrderDate();
        newOrder.orderNumber = order.getOrderNumber();

        if (order.getSeller()) {
            const newSeller = new SoukaiSeller();
            newSeller.name = order.getSeller()?.getName();
            newSeller.email = order.getSeller()?.getEmail();
            newOrder.seller = newSeller;
        }
        return newOrder;
    }

    createOrderItem(orderItem: OrderItem, order: Order): OrderItem {
        const newOrderItem = new SoukaiOrderItem();
        newOrderItem.orderQuantity = orderItem.getOrderQuantity();
        newOrderItem.price = orderItem.getPrice();
        newOrderItem.priceCurrency = orderItem.getPriceCurrency();
        if (order instanceof SoukaiOrder) {
            newOrderItem.relatedOrder.addRelated(order);
        }
        return newOrderItem;
    }

}
