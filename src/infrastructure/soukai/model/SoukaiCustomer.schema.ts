import "soukai-bis/patch-zod";
import {belongsToOne, defineSchema, requireBootedModel} from "soukai-bis";
import {string, url} from "zod";

// The object referenced by schema:customer on an Order. Real inbox orders model
// the customer as a schema:Organization (mirroring the seller) — e.g. a named
// party with an address and a nested contactPoint — not a schema:Person, so this
// must match schema:Organization or the customer relation never loads.
//
// NOTE: the legacy schema also declared a `url: FieldType.String` field. It was
// never read or written (it collided with the model's own identity `url`) and is
// dropped here rather than ported.
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
        address: string().optional().rdfProperty("schema:address"),
        contactPointUrl: url().optional().rdfProperty("schema:contactPoint"),
    },

    relations: {
        contactPoint: belongsToOne(() => requireBootedModel("SoukaiContactPoint"), "contactPointUrl").usingSameDocument(),
    },
});
