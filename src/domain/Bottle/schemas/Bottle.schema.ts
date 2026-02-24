import {FieldType} from "soukai";
import {defineSolidModelSchema} from "soukai-solid";

// https://schema.org/ListItem
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/'
    },
    rdfsClass: 'schema:ListItem',

    fields: {
        price: FieldType.Number,
        priceCurrency: FieldType.String,
        productUrl: {
            type: FieldType.Key,
            rdfProperty: 'schema:subjectOf'
        },
        cellar: FieldType.Key,
        orderItemId: FieldType.Key
    }
});