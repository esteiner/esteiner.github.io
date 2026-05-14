import type {OrderRepository} from "../../domain/Order/OrderRepository.ts";
import {SolidOrder} from "../../domain/Order/SolidOrder.ts";

export class SolidOrderRespository implements OrderRepository {

    private orderInboxUrl: string;
    private orderUrl: string;

    constructor(storageUrl: URL) {
        this.orderInboxUrl = storageUrl.toString() + 'inbox/kellermeister/';
        this.orderUrl = storageUrl.toString() + 'private/kellermeister/orders/';
    }

    async fetchOrders(): Promise<SolidOrder[]> {
        const orders = await SolidOrder.from(this.orderUrl).all();
        const inboxOrders = await SolidOrder.from(this.orderInboxUrl).all();
        return [...orders, ...inboxOrders];;
    }
    async fetchUnprocessedOrders(): Promise<SolidOrder[]> {
        console.log("fetchUnprocessedOrder: from:", this.orderInboxUrl);
        const orders = await SolidOrder.from(this.orderInboxUrl).all();
        return orders;
    }

    async fetchOrderById(orderId: string): Promise<SolidOrder | null> {
        return await SolidOrder.find(orderId) ?? null;
    }

    async saveProcessedOrder(order: SolidOrder): Promise<SolidOrder> {
        console.log("saveProcessedOrder:", order);
        const uuid = globalThis.crypto.randomUUID();
        order.mintUrl(this.orderUrl + uuid, false, 'it');
        return await order.save();
    }


}