import type {ProductRepository} from "../../domain/Product/ProductRepository.ts";
import type {Product} from "../../domain/Product/Product.ts";
import {SoukaiProduct} from "./model/SoukaiProduct.ts";
import {SoukaiRating} from "./model/SoukaiRating.ts";
import {bootModels} from "soukai";
import {fetchLive} from "./localFirstQuery.ts";
import {mintProvisional} from "../shared/resource-identity.ts";

/**
 * Local-first, per-resource product repository. A product is its own resource;
 * its ratings are embedded in the same document.
 */
export class SoukaiProductRepository implements ProductRepository {

    constructor(private readonly podBase: () => string | null) {
        bootModels({SoukaiProduct, SoukaiRating});
    }

    async save(product: Product): Promise<Product> {
        const model = product as SoukaiProduct;
        if (!model.url) {
            model.url = mintProvisional("products");
        }
        await model.save();
        return model;
    }

    async fetchById(productId: string): Promise<Product | null> {
        const model = await SoukaiProduct.find(productId);
        if (!model || model.isSoftDeleted()) {
            return null;
        }
        await model.loadRelation("ratings");
        return model;
    }

    /** All live products with ratings resolved — used to join bottles on read. */
    async fetchAll(): Promise<SoukaiProduct[]> {
        const products = await fetchLive<SoukaiProduct>(SoukaiProduct, "products", this.podBase());
        for (const product of products) {
            await product.loadRelation("ratings");
        }
        return products;
    }
}
