import type {OrderRepository} from "../../domain/Order/OrderRepository.ts";
import type {Order} from "../../domain/Order/Order.ts";
import {SoukaiOrder} from "./model/SoukaiOrder.ts";
import {SoukaiOrderItem} from "./model/SoukaiOrderItem.ts";
import {SoukaiSeller} from "./model/SoukaiSeller.ts";
import {SoukaiCustomer} from "./model/SoukaiCustomer.ts";
import {SoukaiContactPoint} from "./model/SoukaiContactPoint.ts";
import {bootModels, type Engine} from "soukai";
import {SolidEngine} from "soukai-solid";
import {deleteSolidDataset} from "@inrupt/solid-client";
import type {AuthService, SolidSession} from "../../application/ports/AuthService.ts";
import {fetchLive} from "./localFirstQuery.ts";
import {withLocalEngine, withRemoteEngine} from "./engineScope.ts";

/**
 * Local-first, per-resource order repository. Processed orders are stored
 * locally (Order resource with its OrderItems and Seller embedded in the same
 * document) and re-homed on sync.
 *
 * Ingesting orders from the Solid inbox is inherently online (the inbox is a Pod
 * resource, not local IndexedDB): `fetchUnprocessedOrders` reads the inbox via
 * the authenticated Solid engine — the same access path the sync layer uses.
 * Offline / logged out, there are no unprocessed orders.
 */
export class SoukaiOrderRepository implements OrderRepository {

    /**
     * @param inboxEngine builds the engine used to read the Pod inbox. Defaults
     *   to `SolidEngine` over the authenticated fetch; overridable in tests to
     *   simulate the inbox with a local engine.
     */
    constructor(
        private readonly podBase: () => string | null,
        private readonly inboxContainer: () => string | null,
        private readonly auth: AuthService,
        private readonly inboxEngine: (session: SolidSession) => Engine = (session) => new SolidEngine(session.fetch),
    ) {
        bootModels({SoukaiOrder, SoukaiOrderItem, SoukaiSeller, SoukaiCustomer, SoukaiContactPoint});
    }

    async fetchOrders(): Promise<Order[]> {
        const orders = await fetchLive<SoukaiOrder>(SoukaiOrder, "orders", this.podBase());
        await withLocalEngine(async () => {
            for (const order of orders) {
                await order.loadRelation("seller");
                await order.loadRelation("customer");
                await order.customer?.loadRelation("contactPoint");
                await order.loadRelation("positions");
                // Each order item's product is a separate resource (referenced by
                // productUrl), so — unlike the same-document seller/customer/items —
                // it must be loaded explicitly or getProduct() stays undefined.
                for (const item of order.getOrderItems()) {
                    await item.loadRelation("product");
                }
            }
        });
        return orders;
    }

    async fetchUnprocessedOrders(): Promise<Order[]> {
        const session = this.auth.getSession();
        const inbox = this.inboxContainer();
        if (!session.isLoggedIn || !inbox) {
            // Inbox ingestion is online-only; nothing to process when logged out
            // or before the Pod container is resolved.
            return [];
        }
        return await withRemoteEngine(this.inboxEngine(session), async () => {
            const orders = await SoukaiOrder.from(inbox).all();
            for (const order of orders) {
                await order.loadRelation("seller");
                await order.loadRelation("customer");
                // The customer's name/email live on its nested contactPoint
                // (same document); load it so it flattens into the built order.
                await order.customer?.loadRelation("contactPoint");
                await order.loadRelation("positions");
            }
            return orders;
        });
    }

    async fetchOrderById(orderId: string): Promise<Order | null> {
        const order = await withLocalEngine(() => SoukaiOrder.find(orderId));
        return order && !order.isSoftDeleted() ? order : null;
    }

    async saveProcessedOrder(order: Order): Promise<Order> {
        if (order instanceof SoukaiOrder) {
            const uuid = globalThis.crypto.randomUUID();
            order.mintUrl(`local://orders/${uuid}`, false, "it");
            return await withLocalEngine(() => order.save());
        }
        throw new Error("Order must be of type SoukaiOrder");
    }

    async deleteFromInbox(order: Order): Promise<void> {
        const session = this.auth.getSession();
        if (!session.isLoggedIn || !(order instanceof SoukaiOrder)) {
            return;
        }
        const sourceUrl = order.getSourceDocumentUrl();
        if (sourceUrl) {
            await deleteSolidDataset(sourceUrl, {fetch: session.fetch});
        }
    }
}
