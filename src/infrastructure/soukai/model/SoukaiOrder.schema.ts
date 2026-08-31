import "soukai-bis/patch-zod";
import {belongsToOne, belongsToMany, defineSchema, requireBootedModel} from "soukai-bis";
import {array, date, string, url} from "zod";

// https://schema.org/Order
export default defineSchema({
    rdfContexts: {
        schema: "https://schema.org/",
        xsd: "http://www.w3.org/2001/XMLSchema#",
    },
    rdfClass: "schema:Order",
    timestamps: true,
    history: true,

    fields: {
        orderNumber: string().optional().rdfProperty("schema:orderNumber"),
        orderDate: date().optional().rdfProperty("schema:orderDate"),
        customerUrl: url().optional().rdfProperty("schema:customer"),
        sellerUrl: url().optional().rdfProperty("schema:seller"),
        positionUrls: array(url()).optional().rdfProperty("schema:orderedItem"),
    },

    relations: {
        seller: belongsToOne(() => requireBootedModel("SoukaiSeller"), "sellerUrl").usingSameDocument(),
        customer: belongsToOne(() => requireBootedModel("SoukaiCustomer"), "customerUrl").usingSameDocument(),
        positions: belongsToMany(() => requireBootedModel("SoukaiOrderItem"), "positionUrls").usingSameDocument(),
    },
});
