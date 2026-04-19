import {Order} from "./Order";
import {Seller} from "./Seller";
import {OrderItem} from "./OrderItem";
import {Product} from "../Product/Product";
import {ProductFactory} from "../Product/ProductFactory";

export class OrderFactory {

    public createOrder(order: Order): Order {
        const newOrder: Order = new Order();
        newOrder.orderDate = order.orderDate;
        newOrder.seller = order.seller;
        return newOrder;
    }

    public createProducts(order: Order, productFactory: ProductFactory): Product[] {
        const products: Product[] = new Array();
        const newOrder: Order = new Order();
        newOrder.orderDate = order.orderDate;
        newOrder.orderNumber = order.orderNumber;
        newOrder.orderNumber = order.orderNumber;

        if (order.seller) {
            const newSeller = new Seller();
            newSeller.name = order.seller.name;
            newSeller.email = order.seller.email;
            newSeller.url = order.seller.url;
            newOrder.seller = newSeller;
        }

        if (order.positions) {
            const newPositions: OrderItem[] = [];
            for (const orderItem of order.positions) {
                const newOrderItem = new OrderItem();
                newOrderItem.orderQuantity = orderItem.orderQuantity;
                newOrderItem.price = orderItem.price;
                newOrderItem.priceCurrency = orderItem.priceCurrency;
                newOrderItem.relatedOrder.addRelated(newOrder);
                newPositions.push(newOrderItem);

                if (orderItem.orderQuantity) {
                    for (let q = 0; q < orderItem.orderQuantity; q++) {
                        const product = productFactory.createProduct(orderItem.product, newOrderItem);
                        products.push(product);
                    }
                }
            }
            newOrder.positions = newPositions;
        }

        return products;
    }

}