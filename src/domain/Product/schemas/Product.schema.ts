import {FieldType} from "soukai";
import {defineSolidModelSchema} from "soukai-solid";

// https://schema.org/Product
export default defineSolidModelSchema({
    rdfContexts: {
        schema: 'https://schema.org/',
        km: 'https://kellermeister.ch/'
    },

    fields: {
        // schema.org
        name: {
            type: FieldType.String,
            rdfProperty: 'schema:name'
        },
        productionDate: {
            type: FieldType.Date,
            rdfProperty: 'schema:productionDate'
        },
        // kellermeister.ch
        hersteller: {
            type: FieldType.String,
            rdfProperty: 'km:hersteller'
        },
        weinart: {
            type: FieldType.String,
            rdfProperty: 'km:weinart'
        },
        milliliter: {
            type: FieldType.Number,
            rdfProperty: 'km:milliliter'
        },
        region: {
            type: FieldType.String,
            rdfProperty: 'km:region'
        },
        land: {
            type: FieldType.String,
            rdfProperty: 'km:land'
        },
        traubensorte: {
            type: FieldType.String,
            rdfProperty: 'km:traubensorte'
        },
        klassifikation: {
            type: FieldType.String,
            rdfProperty: 'km:klassifikation'
        },
        alkoholgehalt: {
            type: FieldType.String,
            rdfProperty: 'km:alkoholgehalt'
        },
        ausbau: {
            type: FieldType.String,
            rdfProperty: 'km:ausbau'
        },
        biologisch: {
            type: FieldType.String,
            rdfProperty: 'km:biologisch'
        },
        trinkfensterVon: {
            type: FieldType.Date,
            rdfProperty: 'km:trinkfensterVon'
        },
        trinkfensterBis: {
            type: FieldType.Date,
            rdfProperty: 'km:trinkfensterBis'
        }
    }
});