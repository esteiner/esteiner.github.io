import {FieldType} from "soukai";
import {defineSolidModelSchema} from "soukai-solid";

// https://schema.org/ListItem
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/'
    },
    rdfsClasses: ['schema:ListItem'],
    timestamps: true,
    history: true,

    fields: {
        productUrl: {
            type: FieldType.Key,
            rdfProperty: 'schema:subjectOf'
        },
        cellarUrl: {
            type: FieldType.String,
            rdfProperty: "schema:cellar",
            required: true,
        },
        orderItemId: FieldType.Key,

        // Legacy: rating moved to Product (as schema:Rating instances). Kept here
        // only so old pods (where rating was a number on the ListItem) remain
        // readable. New bottles do not write this — see Product.getRatings().
        rating: FieldType.Number,

        // Legacy: price/priceCurrency moved to Product. Kept here only so old
        // pods (where these fields were written on the ListItem) remain readable.
        // New bottles do not write these — see Bottle.getPrice()/getPriceCurrency().
        price: FieldType.Number,
        priceCurrency: FieldType.String
    }
});