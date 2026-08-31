import type {OrderFactory} from "../../../domain/Order/OrderFactory.ts";
import type {Order} from "../../../domain/Order/Order.ts";
import type {OrderItem} from "../../../domain/Order/OrderItem.ts";
import type {Product} from "../../../domain/Product/Product.ts";
import {SoukaiOrder} from "./SoukaiOrder.ts";
import {SoukaiOrderItem} from "./SoukaiOrderItem.ts";
import {SoukaiSeller} from "./SoukaiSeller.ts";
import {SoukaiCustomer} from "./SoukaiCustomer.ts";
import {SoukaiContactPoint} from "./SoukaiContactPoint.ts";
import {SoukaiProduct} from "./SoukaiProduct.ts";

export class SoukaiOrderFactory implements OrderFactory {

    createOrder(order: Order): Order {
        const newOrder = new SoukaiOrder();
        newOrder.orderDate = order.getOrderDate();
        newOrder.orderNumber = order.getOrderNumber();

        if (order.getSeller()) {
            const newSeller = new SoukaiSeller();
            newSeller.name = order.getSeller()?.getName();
            newSeller.email = order.getSeller()?.getEmail();
            newSeller.homepage = order.getSeller()?.getUrl();
            newOrder.relatedSeller.setRelated(newSeller);
        } else {
            console.log("createOrder: no seller found");
        }

        const sourceCustomer = order.getCustomer();
        if (sourceCustomer) {
            const newCustomer = new SoukaiCustomer();
            newCustomer.name = sourceCustomer.getName();
            newCustomer.address = sourceCustomer.getAddress();
            if (sourceCustomer instanceof SoukaiCustomer && sourceCustomer.contactPoint) {
                // Preserve the customer's contactPoint (its name/email) as an
                // embedded same-document resource so it re-homes to the Pod with
                // the order, instead of flattening it onto the customer node.
                const newContactPoint = new SoukaiContactPoint();
                newContactPoint.name = sourceCustomer.contactPoint.getName();
                newContactPoint.email = sourceCustomer.contactPoint.getEmail();
                newCustomer.relatedContactPoint.setRelated(newContactPoint);
            } else {
                newCustomer.email = sourceCustomer.getEmail();
            }
            newOrder.relatedCustomer.setRelated(newCustomer);
        } else {
            console.log("createOrder: no customer found");
        }
        return newOrder;
    }

    createOrderItem(orderItem: OrderItem, order: Order): OrderItem {
        const newOrderItem = new SoukaiOrderItem();
        newOrderItem.orderQuantity = orderItem.getOrderQuantity();
        newOrderItem.price = orderItem.getPrice();
        newOrderItem.priceCurrency = orderItem.getPriceCurrency();
        if (order instanceof SoukaiOrder) {
            newOrderItem.relatedOrder.setRelated(order);
        }
        return newOrderItem;
    }

    linkProduct(orderItem: OrderItem, product: Product): void {
        if (orderItem instanceof SoukaiOrderItem && product instanceof SoukaiProduct) {
            orderItem.relatedProduct.setRelated(product);
        }
    }

}
