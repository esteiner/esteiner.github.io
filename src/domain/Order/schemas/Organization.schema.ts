import {FieldType} from "soukai";
import {defineSolidModelSchema} from "soukai-solid";

// https://schema.org/Organization
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/'
    },
    rdfsClass: 'schema:Organization',

    fields: {
        name: FieldType.String,
        email: FieldType.String,
        url: FieldType.String
    }
});