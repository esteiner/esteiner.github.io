import "soukai-bis/patch-zod";
import {defineSchema} from "soukai-bis";
import {number, string} from "zod";

// https://schema.org/Room
// NOTE: the legacy schema never declared the `km` prefix here, so soukai-solid
// stored displayOrder under the opaque predicate IRI `km:displayOrder` (scheme
// `km`), NOT the full vocab URL. soukai-bis refuses to expand an unknown prefix,
// so we self-map `km` → `km:` to reproduce that exact legacy IRI and stay
// interoperable with existing pods. (Do not point `km` at the full vocab URL —
// that would silently migrate the predicate and drop displayOrder on old data.)
export default defineSchema({
    rdfContexts: {
        schema: "https://schema.org/",
        km: "km:",
    },
    rdfClass: "schema:Room",
    timestamps: true,
    history: true,

    fields: {
        name: string().optional().rdfProperty("schema:name"),
        displayOrder: number().optional().rdfProperty("km:displayOrder"),
    },
});
