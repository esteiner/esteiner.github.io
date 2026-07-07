import type {Product} from "./Product.ts";

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
     * Fetch a product by its resource URL, with ratings resolved.
     */
    fetchById(productId: string): Promise<Product | null>;
}
