import "soukai-bis/patch-zod";
import {belongsToOne, defineSchema, requireBootedModel} from "soukai-bis";
import {number, string, url} from "zod";

// https://schema.org/ListItem
export default defineSchema({
    rdfContexts: {
        schema: "https://schema.org/",
    },
    rdfClass: "schema:ListItem",
    timestamps: true,
    history: true,

    fields: {
        productUrl: url().optional().rdfProperty("schema:subjectOf"),
        // `cellarUrl` is stored as a plain string literal (not an IRI), matching
        // the legacy schema which typed it as String rather than Key. It is
        // `.optional()` so a bottle can be constructed before its cellar is
        // assigned (the ingestion path does `createFromProduct(...)` then
        // `setCellar(...)`); soukai-bis parses required fields at construction,
        // whereas soukai-solid's `required` only applied at save-serialization.
        cellarUrl: string().optional().rdfProperty("schema:cellar"),
        orderItemId: url().optional().rdfProperty("schema:orderItemId"),

        // Legacy: rating moved to Product (as schema:Rating instances). Kept here
        // only so old pods (where rating was a number on the ListItem) remain
        // readable. New bottles do not write this — see Product.getRatings().
        rating: number().optional().rdfProperty("schema:rating"),

        // Legacy: price/priceCurrency moved to Product. Kept here only so old
        // pods (where these fields were written on the ListItem) remain readable.
        // New bottles do not write these — see Bottle.getPrice()/getPriceCurrency().
        price: number().optional().rdfProperty("schema:price"),
        priceCurrency: string().optional().rdfProperty("schema:priceCurrency"),
    },

    relations: {
        product: belongsToOne(() => requireBootedModel("SoukaiProduct"), "productUrl"),
    },
});
