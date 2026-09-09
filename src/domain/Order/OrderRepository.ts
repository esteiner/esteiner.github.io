import type {Order} from "./Order.ts";

export interface OrderRepository {

    /**
     * Fetches all cellars.
     */
    fetchOrders(): Promise<Order[]>;

    fetchUnprocessedOrders(): Promise<Order[]>;

    /**
     * Materialize order(s) from a Turtle document (e.g. produced by the photo
     * conversion service) so they can be ingested directly, without going
     * through the Pod inbox. Every part — order items, product, seller, customer
     * — embedded in the Turtle is resolved from its RDF graph, correlated by
     * subject identifier, WITHOUT dereferencing those identifiers over the
     * network (they are typically synthetic, non-dereferenceable URLs).
     */
    parseOrders(turtle: string): Promise<Order[]>;

    fetchOrderById(orderId: string): Promise<Order | null>;

    saveProcessedOrder(order: Order): Promise<Order>;

    /**
     * Delete a processed order's source document from the Pod inbox, using the
     * authenticated session, so it is not ingested again. No-op when the order
     * has no source document or there is no authenticated session.
     */
    deleteFromInbox(order: Order): Promise<void>;

}