import {FieldType} from "soukai";
import {defineSolidModelSchema} from "soukai-solid";

// https://schema.org/ContactPoint — the customer's contact details (name/email),
// referenced from the customer Organization via schema:contactPoint. Real inbox
// orders carry the customer's email here, not directly on the Organization node.
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/'
    },
    rdfsClasses: ['schema:ContactPoint'],

    fields: {
        name: FieldType.String,
        email: FieldType.String
    }
});
