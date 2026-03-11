import {FieldType} from "soukai";
import {defineSolidModelSchema} from "soukai-solid";

// https://schema.org/Collection
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/'
    },
    rdfsClasses: ['schema:Collection'],

    fields: {
        bottlesUrl: {
            type: FieldType.Array,
            items: FieldType.Key,
            rdfProperty: 'schema:hasPart'
        }
    }
});