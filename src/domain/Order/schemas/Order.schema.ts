import {defineSolidModelSchema} from "soukai-solid";
import {FieldType} from "soukai";

// https://schema.org/Order
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/',
        xsd: 'http://www.w3.org/2001/XMLSchema#'
    },
    rdfsClass: 'schema:Order',

    fields: {
        orderNumber: FieldType.String,
        orderDate: FieldType.Date,
        customerUrl: {
            type: FieldType.Key,
            rdfProperty: 'schema:customer'
        },
        sellerUrl: {
            type: FieldType.Key,
            rdfProperty: 'schema:seller'
        },
        positionUrls: {
            type: FieldType.Array,
            items: FieldType.Key,
            rdfProperty: 'schema:orderedItem',
        }
    }
});