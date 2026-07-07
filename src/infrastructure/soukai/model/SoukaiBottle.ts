import {type Relation} from "soukai";
import {type SolidBelongsToOneRelation} from "soukai-solid";
import Model from "./SoukaiBottle.schema";
import type {Bottle} from "../../../domain/Bottle/Bottle.ts";
import {SoukaiProduct} from "./SoukaiProduct.ts";

export class SoukaiBottle extends Model implements Bottle {

    declare public product: SoukaiProduct;
    declare public relatedProduct: SolidBelongsToOneRelation<SoukaiBottle, SoukaiProduct, typeof SoukaiProduct>;
    // Per-resource: a Product is its own Pod resource, referenced by URL (NOT
    // embedded in the same document as the bottle).
    public productRelationship() : Relation {
        return this
            .belongsToOne(SoukaiProduct, 'productUrl');
    }

    getId(): string {
        return this.url;
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

// Local-first: retain the operation log and propagate deletions across devices.
SoukaiBottle.useSoftDeletes(true);
