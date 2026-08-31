import "soukai-bis/patch-zod";
import {defineSchema} from "soukai-bis";
import {string, url} from "zod";

// https://schema.org/Organization
export default defineSchema({
    rdfContexts: {
        schema: "https://schema.org/",
    },
    rdfClass: "schema:Organization",
    timestamps: false,
    history: false,

    fields: {
        name: string().optional().rdfProperty("schema:name"),
        email: string().optional().rdfProperty("schema:email"),
        // Named `homepage` (not `url`) because `url` collides with the model's
        // own resource identity; mapped to schema:url, read as an IRI.
        homepage: url().optional().rdfProperty("schema:url"),
    },
});
