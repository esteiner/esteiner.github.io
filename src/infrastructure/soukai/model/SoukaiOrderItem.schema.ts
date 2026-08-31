import "soukai-bis/patch-zod";
import {belongsToOne, defineSchema, requireBootedModel} from "soukai-bis";
import {number, string, url} from "zod";

// https://schema.org/OrderItem
export default defineSchema({
    rdfContexts: {
        schema: "https://schema.org/",
        km: "https://vocab.kellermeister.ch/wine/",
    },
    rdfClass: "schema:OrderItem",
    timestamps: false,
    history: false,

    fields: {
        orderQuantity: number().optional().rdfProperty("schema:orderQuantity"),
        price: number().optional().rdfProperty("schema:price"),
        priceCurrency: string().optional().rdfProperty("schema:priceCurrency"),
        orderUrl: url().optional().rdfProperty("km:order"),
        productUrl: url().optional().rdfProperty("schema:orderedItem"),
    },

    relations: {
        order: belongsToOne(() => requireBootedModel("SoukaiOrder"), "orderUrl").usingSameDocument(),
        product: belongsToOne(() => requireBootedModel("SoukaiProduct"), "productUrl"),
    },
});
