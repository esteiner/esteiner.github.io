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

describe("SoukaiBottle disposal date", () => {

    beforeEach(() => {
        installMemoryEngine();
    });

    it("persists the disposal date across save and reload", async () => {
        const disposedAt = new Date("2026-09-01T18:30:00Z");
        const bottle = new SoukaiBottle({cellarUrl: "local://cellars/altglass#it"});
        bottle.setDisposedAt(disposedAt);
        await bottle.save();

        const reloaded = await SoukaiBottle.find(bottle.getId()) as SoukaiBottle;

        expect(reloaded.getDisposedAt()?.getTime()).toBe(disposedAt.getTime());
    });

    it("loads a bottle without a stored disposal date", async () => {
        const turtle = `
            @prefix schema: <https://schema.org/> .
            <${BOTTLE_URL}>
                a schema:ListItem ;
                schema:cellar "local://cellars/altglass#it" .
        `;
        const quads = await turtleToQuads(turtle, {baseIRI: BOTTLE_URL});

        const bottle = await SoukaiBottle.createFromRDF(quads, {url: BOTTLE_URL}) as SoukaiBottle;

        expect(bottle.getCellar()).toBe("local://cellars/altglass#it");
        expect(bottle.getDisposedAt()).toBeUndefined();
    });

    it("prefers the stored disposal date over the rating date", async () => {
        const bottle = new SoukaiBottle({cellarUrl: "local://cellars/altglass#it"});
        bottle.setRating(3);
        bottle.rating.date = new Date("2026-01-01T00:00:00Z");
        const disposedAt = new Date("2026-09-01T00:00:00Z");
        bottle.setDisposedAt(disposedAt);

        expect(bottle.getEffectiveDisposalDate()?.getTime()).toBe(disposedAt.getTime());
    });

    it("falls back to the rating date without a stored disposal date", async () => {
        const bottle = new SoukaiBottle({cellarUrl: "local://cellars/altglass#it"});
        bottle.setRating(3);
        const ratingDate = new Date("2026-01-01T00:00:00Z");
        bottle.rating.date = ratingDate;
        bottle.updatedAt = new Date("2026-05-01T00:00:00Z");

        expect(bottle.getEffectiveDisposalDate()?.getTime()).toBe(ratingDate.getTime());
    });

    it("falls back to the last modification without disposal date or rating", async () => {
        const bottle = new SoukaiBottle({cellarUrl: "local://cellars/altglass#it"});
        await bottle.save();

        expect(bottle.getEffectiveDisposalDate()).toBeInstanceOf(Date);
        expect(bottle.getEffectiveDisposalDate()?.getTime()).toBe(bottle.updatedAt?.getTime());
    });
});
