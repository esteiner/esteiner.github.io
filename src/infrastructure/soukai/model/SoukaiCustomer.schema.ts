import {FieldType} from "soukai";
import {defineSolidModelSchema} from "soukai-solid";

// The object referenced by schema:customer on an Order. Real inbox orders model
// the customer as a schema:Organization (mirroring the seller) — e.g. a named
// party with an address and a nested contactPoint — not a schema:Person, so this
// must match schema:Organization or the customer relation never loads.
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/'
    },
    rdfsClasses: ['schema:Organization'],

    fields: {
        name: FieldType.String,
        email: FieldType.String,
        url: FieldType.String,
        address: FieldType.String,
        contactPointUrl: {
            type: FieldType.Key,
            rdfProperty: 'schema:contactPoint'
        }
    }
});
