import "soukai-bis/patch-zod";
import {belongsToOne, defineSchema, requireBootedModel} from "soukai-bis";
import {number, string, url} from "zod";

// https://schema.org/ListItem
export default defineSchema({
    rdfContexts: {
        schema: "https://schema.org/",
        km: "https://vocab.kellermeister.ch/wine/",
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

        // Foreign key for the same-document `rating` relation (a schema:Rating
        // node embedded in the bottle document). See the `rating` relation below
        // and Bottle.setRating()/getRating().
        ratingUrl: url().optional().rdfProperty("km:rating"),

        // Legacy: rating used to be a bare number on the ListItem, then moved to
        // Product. Kept read-only so old pods remain readable — Bottle.getRating()
        // surfaces it as a dateless Rating when no structured rating is present.
        legacyRating: number().optional().rdfProperty("schema:rating"),
    },

    relations: {
        product: belongsToOne(() => requireBootedModel("SoukaiProduct"), "productUrl"),
        // A single rating stored on the bottle, embedded in the bottle document
        // so writing a rating rewrites only this (small) resource, not the product.
        rating: belongsToOne(() => requireBootedModel("SoukaiRating"), "ratingUrl").usingSameDocument(),
    },
});
