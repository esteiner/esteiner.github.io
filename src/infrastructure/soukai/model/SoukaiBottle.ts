import type {BelongsToOneRelation} from "soukai-bis";
import Model from "./SoukaiBottle.schema";
import type {Bottle} from "../../../domain/Bottle/Bottle.ts";
import type {Rating} from "../../../domain/Product/Rating.ts";
import {SoukaiProduct} from "./SoukaiProduct.ts";
import {SoukaiRating} from "./SoukaiRating.ts";

export class SoukaiBottle extends Model implements Bottle {

    // Relation wiring lives in SoukaiBottle.schema.ts (per-resource: a Product is
    // its own Pod resource, referenced by URL, NOT embedded in the bottle document).
    declare public product: SoukaiProduct;
    declare public relatedProduct: BelongsToOneRelation<this, SoukaiProduct, typeof SoukaiProduct>;

    // A single rating embedded in the bottle document (same-document relation).
    declare public rating: SoukaiRating;
    declare public relatedRating: BelongsToOneRelation<this, SoukaiRating, typeof SoukaiRating>;

    getId(): string {
        return this.url as string;
    }
    getCellar(): string {
        // cellarUrl is optional at the schema level (a bottle can be built before
        // its cellar is assigned), but every persisted/read bottle has one.
        return this.cellarUrl as string;
    }
    setCellar(cellarId: string): void {
        this.cellarUrl = cellarId;
    }
    getProduct(): SoukaiProduct {
        return this.product;
    }
    getRating(): Rating | undefined {
        // Prefer the structured, dated rating stored on this bottle.
        if (this.rating) {
            return this.rating;
        }
        // Backward-compat: surface a legacy numeric schema:rating (written by old
        // pods before ratings became structured) as a dateless Rating.
        const legacy = this.orUndefined(this.legacyRating);
        if (legacy !== undefined) {
            return {
                getId: () => this.getId(),
                getValue: () => legacy,
                getDate: () => undefined as unknown as Date,
            };
        }
        return undefined;
    }
    setRating(value: number): void {
        const rating: SoukaiRating = new SoukaiRating();
        rating.value = value;
        rating.date = new Date();
        // Attach through the relation so the rating is embedded in the bottle
        // document on save (a plain assignment does not register it with bis).
        this.relatedRating.setRelated(rating);
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }

}
