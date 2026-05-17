import {type Relation} from "soukai";
import {type SolidBelongsToOneRelation} from "soukai-solid";
import Model from "./SoukaiBottle.schema";
import type {Bottle} from "../../../domain/Bottle/Bottle.ts";
import {SoukaiProduct} from "./SoukaiProduct.ts";

export class SoukaiBottle extends Model implements Bottle {
    static timestamps = false;

    declare public product: SoukaiProduct;
    declare public relatedProduct: SolidBelongsToOneRelation<SoukaiBottle, SoukaiProduct, typeof SoukaiProduct>;
    public productRelationship() : Relation {
        return this
            .belongsToOne(SoukaiProduct, 'productUrl')
            .usingSameDocument(true);
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
        return this.orUndefined(this.price);
    }
    getPriceCurrency(): string {
        return this.orUndefined(this.priceCurrency);
    }
    getRating(): number {
        return this.orUndefined(this.rating);
    }
    setRating(rating: number) {
        this.rating = rating;
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }

}