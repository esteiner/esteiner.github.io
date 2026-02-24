import {FieldType} from "soukai";
import {defineSolidModelSchema} from "soukai-solid";

// https://schema.org/Person
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/',
        foaf: 'http://xmlns.com/foaf/0.1/',
        pim: 'http://www.w3.org/ns/pim/space#'
    },
    rdfsClass: 'schema:Person',

    fields: {
        name: FieldType.String,
        storageUrl: {
            type: FieldType.Key,
            rdfProperty: 'pim:storage',
        },
    }
});
