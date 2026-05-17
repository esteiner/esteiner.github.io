import {defineSolidModelSchema} from "soukai-solid";
import {FieldType} from "soukai";

// https://schema.org/Order
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/'
    },
    rdfsClasses: ['schema:Room'],

    fields: {
        name: FieldType.String,
        displayOrder: {
            type: FieldType.Number,
            rdfProperty: 'km:displayOrder'
        },
    }
});
