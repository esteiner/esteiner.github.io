import {FieldType} from "soukai";
import {defineSolidModelSchema} from "soukai-solid";

// https://schema.org/ListItem
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/'
    },
    rdfsClasses: ['schema:ListItem'],

    fields: {
        productUrl: {
            type: FieldType.Key,
            rdfProperty: 'schema:subjectOf'
        },
        cellar: FieldType.Key,
        orderItemId: FieldType.Key,
        rating: FieldType.Number,
        // Legacy: price/priceCurrency moved to Product. Kept here only so old
        // pods (where these fields were written on the ListItem) remain readable.
        // New bottles do not write these — see Bottle.getPrice()/getPriceCurrency().
        price: FieldType.Number,
        priceCurrency: FieldType.String
    }
});