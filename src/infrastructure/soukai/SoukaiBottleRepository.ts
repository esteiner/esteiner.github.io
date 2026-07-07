import type {BottleRepository} from "../../domain/Bottle/BottleRepository.ts";
import type {Bottle} from "../../domain/Bottle/Bottle.ts";
import {SoukaiBottle} from "./model/SoukaiBottle.ts";
import {SoukaiProduct} from "./model/SoukaiProduct.ts";
import {SoukaiRating} from "./model/SoukaiRating.ts";
import {bootModels} from "soukai";
import {fetchLive} from "./localFirstQuery.ts";
import {mintProvisional} from "../shared/resource-identity.ts";
import type {SoukaiProductRepository} from "./SoukaiProductRepository.ts";

/**
 * Local-first, per-resource bottle repository. Bottles are separate resources
 * referencing their product by URL; on read, products are fetched once and
 * joined in memory (cross-container relations are lazy — see the save spike).
 */
export class SoukaiBottleRepository implements BottleRepository {

    constructor(
        private readonly podBase: () => string | null,
        private readonly productRepository: SoukaiProductRepository,
    ) {
        bootModels({SoukaiBottle, SoukaiProduct, SoukaiRating});
    }

    async fetchBottles(): Promise<Bottle[]> {
        const bottles = await fetchLive<SoukaiBottle>(SoukaiBottle, "bottles", this.podBase());
        const products = await this.productRepository.fetchAll();
        const productByUrl = new Map(products.map((product) => [product.url, product]));

        for (const bottle of bottles) {
            const product = bottle.productUrl ? productByUrl.get(bottle.productUrl) : undefined;
            if (product) {
                bottle.product = product;
            }
        }
        // Preserve the previous invariant: only bottles with a resolved product
        // are surfaced (downstream code assumes bottle.getProduct() is present).
        return bottles.filter((bottle) => bottle.getProduct());
    }

    async save(bottle: Bottle): Promise<Bottle> {
        const model = bottle as SoukaiBottle;
        if (!model.url) {
            model.url = mintProvisional("bottles");
        }
        if (!model.productUrl && model.getProduct()) {
            model.productUrl = (model.getProduct() as SoukaiProduct).url;
        }
        await model.save();
        return model;
    }

    async saveAll(bottles: Bottle[]): Promise<void> {
        for (const bottle of bottles) {
            await this.save(bottle);
        }
    }

    async delete(bottle: Bottle): Promise<void> {
        await (bottle as SoukaiBottle).delete();
    }
}
