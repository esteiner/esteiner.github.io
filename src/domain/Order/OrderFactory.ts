import {SolidOrder} from "./SolidOrder";
import {SolidSeller} from "./SolidSeller";
import {SolidOrderItem} from "./SolidOrderItem";

export class OrderFactory {

    public createOrder(order: SolidOrder): SolidOrder {
        const newOrder: SolidOrder = new SolidOrder();
        newOrder.orderDate = order.orderDate;
        newOrder.orderNumber = order.orderNumber;

        if (order.seller) {
            const newSeller = new SolidSeller();
            newSeller.name = order.seller.name;
            newSeller.email = order.seller.email;
            newSeller.url = order.seller.url;
            newOrder.seller = newSeller;
        }
        return newOrder;
    }

    public createOrderItem(orderItem: SolidOrderItem, order: SolidOrder): SolidOrderItem {
        const newOrderItem = new SolidOrderItem();
        newOrderItem.orderQuantity = orderItem.orderQuantity;
        newOrderItem.price = orderItem.price;
        newOrderItem.priceCurrency = orderItem.priceCurrency;
        newOrderItem.relatedOrder.addRelated(order);
        return newOrderItem;
    }


}