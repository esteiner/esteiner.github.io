import type {ProductRepository} from "../../domain/Product/ProductRepository.ts";
import type {Product} from "../../domain/Product/Product.ts";
import type {OrderItem} from "../../domain/Order/OrderItem.ts";
import {SoukaiProduct} from "./model/SoukaiProduct.ts";
import {SoukaiOrderItem} from "./model/SoukaiOrderItem.ts";
import {bootSoukaiModels} from "./bootModels.ts";
import {fetchLive} from "./localFirstQuery.ts";
import {mintProvisional} from "../shared/resource-identity.ts";
import {withLocalEngine} from "./engineScope.ts";

/**
 * Local-first, per-resource product repository. A product is its own resource;
 * its ratings are embedded in the same document.
 */
export class SoukaiProductRepository implements ProductRepository {

    constructor(private readonly podBase: () => string | null) {
        bootSoukaiModels();
    }

    async save(product: Product): Promise<Product> {
        const model = product as SoukaiProduct;
        if (!model.url) {
            model.url = mintProvisional("products");
        }
        await withLocalEngine(() => model.save());
        return model;
    }

    async linkOrderItem(product: Product, orderItem: OrderItem): Promise<void> {
        if (product instanceof SoukaiProduct && orderItem instanceof SoukaiOrderItem) {
            // Back-link (km:orderItem) to the order item's now-final URL, then
            // persist. This is a cross-resource IRI, so on sync `MigrateLocalUrls`
            // re-homes it to the Pod alongside the order-item → product reference.
            product.orderItemUrl = orderItem.getId();
            await withLocalEngine(() => product.save());
        }
    }

    async fetchById(productId: string): Promise<Product | null> {
        return await withLocalEngine(async () => {
            const model = await SoukaiProduct.find(productId);
            if (!model) {
                // A tombstoned (soft-deleted) product is no longer a Product
                // document, so `find` returns null — no explicit check needed.
                return null;
            }
            await model.loadRelation("ratings");
            return model;
        });
    }

    /** All live products with ratings resolved — used to join bottles on read. */
    async fetchAll(): Promise<SoukaiProduct[]> {
        const products = await fetchLive<SoukaiProduct>(SoukaiProduct, "products", this.podBase());
        await withLocalEngine(async () => {
            for (const product of products) {
                await product.loadRelation("ratings");
                // Resolve the source chain product → order item → order → seller
                // so the product view's "Quelle" can show the seller without a
                // per-render fetch. Only products that carry the back-link are
                // touched (older products without it simply show no source).
                if (product.orderItemUrl) {
                    await product.loadRelation("orderItem");
                    const orderItem = product.getOrderItem();
                    if (orderItem) {
                        await orderItem.loadRelation("order");
                        await orderItem.getOrder()?.loadRelation("seller");
                    }
                }
            }
        });
        return products;
    }
}
