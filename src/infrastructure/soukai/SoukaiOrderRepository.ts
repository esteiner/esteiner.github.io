import type {OrderRepository} from "../../domain/Order/OrderRepository.ts";
import type {Order} from "../../domain/Order/Order.ts";
import {SoukaiOrder} from "./model/SoukaiOrder.ts";
import {SolidEngine, type Engine} from "soukai-bis";
import {deleteSolidDataset} from "@inrupt/solid-client";
import type {AuthService, SolidSession} from "../../application/ports/AuthService.ts";
import {bootSoukaiModels} from "./bootModels.ts";
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
     * Maps an unprocessed order's id (its synthetic inbox identifier, e.g.
     * `https://kellermeister.ch/orders/1004727`) to the URL of the inbox document
     * it was read from. Populated by `fetchUnprocessedOrders`, consumed by
     * `deleteFromInbox`: an inbox order's own url is NOT the inbox file, so the
     * source document must be tracked rather than derived from the model.
     */
    private readonly inboxDocumentByOrderId = new Map<string, string>();

    /**
     * @param inboxEngine builds the engine used to read the Pod inbox. Defaults
     *   to `SolidEngine` over the authenticated fetch; overridable in tests to
     *   simulate the inbox with a local engine.
     */
    constructor(
        private readonly podBase: () => string | null,
        private readonly inboxContainer: () => string | null,
        private readonly auth: AuthService,
        private readonly inboxEngine: (session: SolidSession) => Engine = (session) => new SolidEngine({fetch: session.fetch}),
    ) {
        bootSoukaiModels();
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
        const engine = this.inboxEngine(session);
        return await withRemoteEngine(engine, async () => {
            // An inbox order embeds ALL of its parts — order items, product,
            // seller, customer, and the customer's contactPoint — in the single
            // inbox document, each identified by a synthetic, non-dereferenceable
            // absolute URL (e.g. https://kellermeister.ch/orders/1004727/1).
            // `createManyFromDocument` materializes the whole embedded graph from
            // the document's quads (relations included), with NO fetch of those
            // identifiers (which are CORS-blocked in the browser and resolve to
            // nothing). We do NOT call loadRelation: it would re-load via a fetch
            // and clear the already-correct same-document relation.
            //
            // We read the container's documents ourselves (rather than
            // `SoukaiOrder.all`) so we can remember each order's SOURCE document
            // URL for deleteFromInbox — the order's own url is a synthetic
            // identifier, not the inbox file.
            const documents = await engine.readDocuments({containerUrl: inbox});
            this.inboxDocumentByOrderId.clear();
            const orders: SoukaiOrder[] = [];
            for (const document of Object.values(documents)) {
                for (const order of await SoukaiOrder.createManyFromDocument(document)) {
                    this.inboxDocumentByOrderId.set(order.getId(), document.url);
                    orders.push(order);
                }
            }
            return orders;
        });
    }

    async fetchOrderById(orderId: string): Promise<Order | null> {
        // A tombstoned (soft-deleted) order is no longer an Order document, so
        // `find` returns null — no explicit soft-delete check needed.
        const order = await withLocalEngine(() => SoukaiOrder.find(orderId));
        return order ?? null;
    }

    async saveProcessedOrder(order: Order): Promise<Order> {
        if (order instanceof SoukaiOrder) {
            const uuid = globalThis.crypto.randomUUID();
            order.mintUrl({documentUrl: `local://orders/${uuid}`, documentExists: false, resourceHash: "it"});
            return await withLocalEngine(() => order.save());
        }
        throw new Error("Order must be of type SoukaiOrder");
    }

    async deleteFromInbox(order: Order): Promise<void> {
        const session = this.auth.getSession();
        if (!session.isLoggedIn || !(order instanceof SoukaiOrder)) {
            return;
        }
        // Delete the actual inbox document the order was read from — NOT
        // `order.getDocumentUrl()`, which for an inbox order derives from its
        // synthetic identifier (e.g. https://kellermeister.ch/orders/1004727) and
        // would issue a cross-origin, CORS-blocked request to a non-existent URL.
        const sourceUrl = this.inboxDocumentByOrderId.get(order.getId());
        if (sourceUrl) {
            await deleteSolidDataset(sourceUrl, {fetch: session.fetch});
        }
    }
}
