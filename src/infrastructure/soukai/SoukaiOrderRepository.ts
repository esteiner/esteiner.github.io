import type {OrderRepository} from "../../domain/Order/OrderRepository.ts";
import type {Order} from "../../domain/Order/Order.ts";
import {SoukaiOrder} from "./model/SoukaiOrder.ts";
import {SoukaiOrderItem} from "./model/SoukaiOrderItem.ts";
import {SoukaiSeller} from "./model/SoukaiSeller.ts";
import {bootModels} from "soukai";
import {fetchLive} from "./localFirstQuery.ts";

/**
 * Local-first, per-resource order repository. Processed orders are stored
 * locally (Order resource with its OrderItems and Seller embedded in the same
 * document) and re-homed on sync.
 *
 * NOTE: ingesting orders from the Solid inbox is inherently online (the inbox is
 * a Pod resource, not local IndexedDB). Offline, there are no unprocessed
 * orders — see the design's open question on offline order ingestion.
 */
export class SoukaiOrderRepository implements OrderRepository {

    constructor(private readonly podBase: () => string | null) {
        bootModels({SoukaiOrder, SoukaiOrderItem, SoukaiSeller});
    }

    async fetchOrders(): Promise<Order[]> {
        const orders = await fetchLive<SoukaiOrder>(SoukaiOrder, "orders", this.podBase());
        for (const order of orders) {
            await order.loadRelation("seller");
            await order.loadRelation("positions");
        }
        return orders;
    }

    async fetchUnprocessedOrders(): Promise<Order[]> {
        // Inbox ingestion is online-only; nothing to process from local storage.
        return [];
    }

    async fetchOrderById(orderId: string): Promise<Order | null> {
        const order = await SoukaiOrder.find(orderId);
        return order && !order.isSoftDeleted() ? order : null;
    }

    async saveProcessedOrder(order: Order): Promise<Order> {
        if (order instanceof SoukaiOrder) {
            const uuid = globalThis.crypto.randomUUID();
            order.mintUrl(`local://orders/${uuid}`, false, "it");
            return await order.save();
        }
        throw new Error("Order must be of type SoukaiOrder");
    }
}
