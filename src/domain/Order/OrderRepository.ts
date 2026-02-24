import type {Order} from "./Order.ts";

export interface OrderRepository {

    /**
     * Fetches all cellars.
     */
    fetchOrders(): Promise<Order[]>;

    fetchUnprocessedOrders(): Promise<Order[]>;

    fetchOrderById(orderId: string): Promise<Order | null>;

    saveProcessedOrder(order: Order): Promise<Order>;

}