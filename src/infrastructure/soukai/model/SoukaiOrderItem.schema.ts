import {FieldType} from "soukai";
import {defineSolidModelSchema} from "soukai-solid";

// https://schema.org/OrderItem
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/',
        km: 'https://vocab.kellermeister.ch/wine/'
    },
    rdfsClasses: ['schema:OrderItem'],

    fields: {
        orderQuantity: FieldType.Number,
        price: FieldType.Number,
        priceCurrency: FieldType.String,
        orderUrl: {
            type: FieldType.Key,
            rdfProperty: 'km:order'
        },
        productUrl: {
            type: FieldType.Key,
            rdfProperty: 'schema:orderedItem'
        }
    }
});