import {FieldType} from "soukai";
import {defineSolidModelSchema} from "soukai-solid";

// https://schema.org/OrderItem
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/'
    },
    rdfsClass: 'schema:OrderItem',

    fields: {
        orderQuantity: FieldType.Number,
        price: FieldType.Number,
        priceCurrency: FieldType.String,
        productUrl: {
            type: FieldType.Key,
            rdfProperty: 'schema:orderedItem'
        }
    }
});