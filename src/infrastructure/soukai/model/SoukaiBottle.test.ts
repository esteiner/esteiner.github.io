import {describe, it, expect, beforeEach} from "vitest";
import {turtleToQuads} from "@noeldemartin/solid-utils";
import {installMemoryEngine} from "../../../testing/soukai.ts";
import {SoukaiBottle} from "./SoukaiBottle.ts";

const BOTTLE_URL = "local://bottles/legacy#it";

describe("SoukaiBottle legacy price", () => {

    beforeEach(() => {
        installMemoryEngine();
    });

    it("does not read a legacy schema:price / schema:priceCurrency stored on the bottle", async () => {
        const turtle = `
            @prefix schema: <https://schema.org/> .
            <${BOTTLE_URL}>
                a schema:ListItem ;
                schema:subjectOf <local://products/barolo#it> ;
                schema:cellar "local://cellars/keller#it" ;
                schema:price 25 ;
                schema:priceCurrency "CHF" .
        `;
        const quads = await turtleToQuads(turtle, {baseIRI: BOTTLE_URL});

        const bottle = await SoukaiBottle.createFromRDF(quads, {url: BOTTLE_URL}) as SoukaiBottle;

        expect(bottle).not.toBeNull();
        expect(bottle.getCellar()).toBe("local://cellars/keller#it");
        const attributes = bottle.getAttributes() as Record<string, unknown>;
        expect(attributes).not.toHaveProperty("price");
        expect(attributes).not.toHaveProperty("priceCurrency");
        expect("getPrice" in bottle).toBe(false);
        expect("getPriceCurrency" in bottle).toBe(false);
    });
});
