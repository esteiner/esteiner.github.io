import type {SolidOrder} from "./SolidOrder.ts";

export interface OrderRepository {

    /**
     * Fetches all cellars.
     */
    fetchOrders(): Promise<SolidOrder[]>;

    fetchUnprocessedOrders(): Promise<SolidOrder[]>;

    fetchOrderById(orderId: string): Promise<SolidOrder | null>;

    saveProcessedOrder(order: SolidOrder): Promise<SolidOrder>;

}