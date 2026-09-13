import type {Product} from "./Product.ts";
import type {OrderItem} from "../Order/OrderItem.ts";

/**
 * Per-resource repository for products. A product is its own local/Pod resource
 * (shared between bottles and order items), referenced by URL. Local-only.
 */
export interface ProductRepository {

    /**
     * Persist a single product (create or update). Embedded ratings are saved
     * within the product's own document.
     */
    save(product: Product): Promise<Product>;

    /**
     * Record the order item a product came from (its `km:orderItem` back-link)
     * and persist the update. Called after the order item has a stable persisted
     * URL, so the product → order item → order → seller chain resolves on read.
     */
    linkOrderItem(product: Product, orderItem: OrderItem): Promise<void>;

    /**
     * Fetch a product by its resource URL, with ratings resolved.
     */
    fetchById(productId: string): Promise<Product | null>;
}
