import {FieldType} from "soukai";
import {defineSolidModelSchema} from "soukai-solid";

// https://schema.org/Organization
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/'
    },
    rdfsClasses: ['schema:Organization'],

    fields: {
        name: FieldType.String,
        email: FieldType.String,
        // Named `homepage` (not `url`) because `url` collides with SolidModel's
        // own resource identity; mapped to schema:url, read as an IRI (Key).
        homepage: {
            type: FieldType.Key,
            rdfProperty: 'schema:url'
        }
    }
});