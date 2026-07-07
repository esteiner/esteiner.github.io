import type {Order} from "./Order.ts";

export interface OrderRepository {

    /**
     * Fetches all cellars.
     */
    fetchOrders(): Promise<Order[]>;

    fetchUnprocessedOrders(): Promise<Order[]>;

    fetchOrderById(orderId: string): Promise<Order | null>;

    saveProcessedOrder(order: Order): Promise<Order>;

    /**
     * Delete a processed order's source document from the Pod inbox, using the
     * authenticated session, so it is not ingested again. No-op when the order
     * has no source document or there is no authenticated session.
     */
    deleteFromInbox(order: Order): Promise<void>;

}