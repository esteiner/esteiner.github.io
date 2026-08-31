import type {BelongsToOneRelation} from "soukai-bis";
import Model from "./SoukaiBottle.schema";
import type {Bottle} from "../../../domain/Bottle/Bottle.ts";
import {SoukaiProduct} from "./SoukaiProduct.ts";

export class SoukaiBottle extends Model implements Bottle {

    // Relation wiring lives in SoukaiBottle.schema.ts (per-resource: a Product is
    // its own Pod resource, referenced by URL, NOT embedded in the bottle document).
    declare public product: SoukaiProduct;
    declare public relatedProduct: BelongsToOneRelation<this, SoukaiProduct, typeof SoukaiProduct>;

    getId(): string {
        return this.url as string;
    }
    getCellar(): string {
        return this.cellarUrl;
    }
    setCellar(cellarId: string): void {
        this.cellarUrl = cellarId;
    }
    getProduct(): SoukaiProduct {
        return this.product;
    }
    getPrice(): number {
        const productPrice = this.getProduct().getPrice();
        return productPrice ? productPrice : this.orUndefined(this.price);
    }
    getPriceCurrency(): string {
        const productPrice = this.getProduct().getPrice();
        return productPrice ? this.getProduct().getPriceCurrency() : this.orUndefined(this.priceCurrency);
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }

}
