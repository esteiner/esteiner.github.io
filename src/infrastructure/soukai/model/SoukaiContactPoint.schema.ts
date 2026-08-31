import "soukai-bis/patch-zod";
import {defineSchema} from "soukai-bis";
import {string} from "zod";

// https://schema.org/ContactPoint — the customer's contact details (name/email),
// referenced from the customer Organization via schema:contactPoint. Real inbox
// orders carry the customer's email here, not directly on the Organization node.
export default defineSchema({
    rdfContexts: {
        schema: "https://schema.org/",
    },
    rdfClass: "schema:ContactPoint",
    timestamps: false,
    history: false,

    fields: {
        name: string().optional().rdfProperty("schema:name"),
        email: string().optional().rdfProperty("schema:email"),
    },
});
