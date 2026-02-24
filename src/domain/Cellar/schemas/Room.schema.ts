import {FieldType} from "soukai";
import {defineSolidModelSchema} from "soukai-solid";

// https://schema.org/Room
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/'
    },
    rdfsClass: 'schema:Room',

    fields: {
        name: FieldType.String,
        displayOrder: {
            type: FieldType.Number,
            rdfProperty: 'km:displayOrder'
        }
    }
});