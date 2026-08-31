import "soukai-bis/patch-zod";
import {defineSchema} from "soukai-bis";
import {string, url} from "zod";

// https://schema.org/Person
// NOTE: currently unused (the app reads the Solid session/profile directly);
// kept and migrated to soukai-bis for consistency with the other models.
export default defineSchema({
    rdfContexts: {
        schema: "https://schema.org/",
        foaf: "http://xmlns.com/foaf/0.1/",
        pim: "http://www.w3.org/ns/pim/space#",
    },
    rdfClass: "schema:Person",
    timestamps: false,
    history: false,

    fields: {
        name: string().optional().rdfProperty("schema:name"),
        storageUrl: url().optional().rdfProperty("pim:storage"),
    },
});
