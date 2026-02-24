import type {OrderRepository} from "../../domain/Order/OrderRepository.ts";
import {Order} from "../../domain/Order/Order.ts";

export class SolidOrderRespository implements OrderRepository {

    private orderInboxUrl: string;
    private orderUrl: string;

    constructor(storageUrl: URL) {
        this.orderInboxUrl = storageUrl.toString() + 'inbox/kellermeister/';
        this.orderUrl = storageUrl.toString() + 'private/kellermeister/orders/';
    }

    async fetchOrders(): Promise<Order[]> {
        const orders = await Order.from(this.orderUrl).all();
        const inboxOrders = await Order.from(this.orderInboxUrl).all();
        return [...orders, ...inboxOrders];;
    }
    async fetchUnprocessedOrders(): Promise<Order[]> {
        console.log("fetchUnprocessedOrder: from:", this.orderInboxUrl);
        const orders = await Order.from(this.orderInboxUrl).all();
        return orders;
    }

    async fetchOrderById(orderId: string): Promise<Order | null> {
        return await Order.find(orderId) ?? null;
    }

    async saveProcessedOrder(order: Order): Promise<Order> {
        console.log("saveProcessedOrder:", order);
        const uuid = globalThis.crypto.randomUUID();
        order.mintUrl(this.orderUrl + uuid, false, 'it');
        return await order.save();
    }


}