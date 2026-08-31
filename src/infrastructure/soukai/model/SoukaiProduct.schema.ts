import "soukai-bis/patch-zod";
import {belongsToOne, belongsToMany, defineSchema, requireBootedModel} from "soukai-bis";
import {array, date, number, string, url} from "zod";

// https://schema.org/Product
export default defineSchema({
    rdfContexts: {
        schema: "https://schema.org/",
        km: "https://vocab.kellermeister.ch/wine/",
    },
    rdfClass: "schema:Product",
    timestamps: true,
    history: true,

    fields: {
        // schema.org
        name: string().optional().rdfProperty("schema:name"),
        productionDate: date().optional().rdfProperty("schema:productionDate"),
        price: number().optional().rdfProperty("schema:price"),
        priceCurrency: string().optional().rdfProperty("schema:priceCurrency"),
        // vocab.kellermeister.ch/wine/
        weinname: string().optional().rdfProperty("km:weinname"),
        hersteller: string().optional().rdfProperty("km:hersteller"),
        weinart: string().optional().rdfProperty("km:weinart"),
        weinfarbe: string().optional().rdfProperty("km:weinfarbe"),
        milliliter: number().optional().rdfProperty("km:milliliter"),
        region: string().optional().rdfProperty("km:region"),
        land: string().optional().rdfProperty("km:land"),
        traubensorte: string().optional().rdfProperty("km:traubensorte"),
        klassifikation: string().optional().rdfProperty("km:klassifikation"),
        alkoholgehalt: string().optional().rdfProperty("km:alkoholgehalt"),
        ausbau: string().optional().rdfProperty("km:ausbau"),
        biologisch: string().optional().rdfProperty("km:biologisch"),
        trinkfensterVon: date().optional().rdfProperty("km:trinkfensterVon"),
        trinkfensterBis: date().optional().rdfProperty("km:trinkfensterBis"),
        orderItemUrl: url().optional().rdfProperty("km:orderItem"),
        ratingUrls: array(url()).optional().rdfProperty("km:hasRating"),
    },

    relations: {
        orderItem: belongsToOne(() => requireBootedModel("SoukaiOrderItem"), "orderItemUrl"),
        ratings: belongsToMany(() => requireBootedModel("SoukaiRating"), "ratingUrls").usingSameDocument(),
    },
});
