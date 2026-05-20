import {FieldType} from "soukai";
import {defineSolidModelSchema} from "soukai-solid";

// https://schema.org/Rating
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/'
    },
    rdfsClasses: ['schema:Rating'],

    fields: {
        value: {
            type: FieldType.Number,
            rdfProperty: 'schema:ratingValue'
        },
        date: {
            type: FieldType.Date,
            rdfProperty: 'schema:dateCreated'
        }
    }
});
