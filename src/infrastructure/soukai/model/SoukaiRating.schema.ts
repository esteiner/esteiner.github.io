import "soukai-bis/patch-zod";
import {defineSchema} from "soukai-bis";
import {date, number} from "zod";

// https://schema.org/Rating
export default defineSchema({
    rdfContexts: {
        schema: "https://schema.org/",
    },
    rdfClass: "schema:Rating",
    timestamps: false,
    history: false,

    fields: {
        value: number().optional().rdfProperty("schema:ratingValue"),
        date: date().optional().rdfProperty("schema:dateCreated"),
    },
});
