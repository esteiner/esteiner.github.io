/**
 * Acceptance tests for the local-first / per-resource behavior that runs WITHOUT
 * a Pod: offline create/read and the well-known cellar bootstrap, driven through
 * the real repositories on an isolated in-memory engine.
 *
 * Pod synchronization is now performed by soukai-bis's `Sync` job, which needs a
 * real `SolidUserProfile` + `SolidEngine` and cannot be faithfully simulated with
 * an in-process engine. Its coverage lives in:
 *   - `solid/SolidSyncService.test.ts` — the re-home phase (MigrateLocalUrls +
 *     cellarUrl fixup), unit-tested;
 *   - the Playwright e2e suite against the Community Solid Server — the push/pull
 *     round-trip (deletion propagation, embedded order/customer/contactPoint sync).
 * The old "local reads stay local during sync" test is dropped: bis `Sync` takes
 * the local and remote engines explicitly (no global engine swap), so that
 * misrouting window no longer exists — the engine gate is covered by
 * `soukai/engineScope.test.ts`.
 */
import {describe, it, expect, beforeEach} from "vitest";

import {installMemoryEngine} from "../testing/soukai.ts";
import {SoukaiCellar} from "./soukai/model/SoukaiCellar.ts";
import {SoukaiProduct} from "./soukai/model/SoukaiProduct.ts";
import {SoukaiBottle} from "./soukai/model/SoukaiBottle.ts";
import {SoukaiCellarRepository} from "./soukai/SoukaiCellarRepository.ts";
import {SoukaiProductRepository} from "./soukai/SoukaiProductRepository.ts";
import {SoukaiBottleRepository} from "./soukai/SoukaiBottleRepository.ts";
import {isProvisional} from "./shared/resource-identity.ts";

beforeEach(() => {
    installMemoryEngine();
});

describe("local-first acceptance", () => {

    it("creates and reads cellars & bottles fully offline (provisional identities)", async () => {
        const cellars = new SoukaiCellarRepository(() => null);
        const products = new SoukaiProductRepository(() => null);
        const bottles = new SoukaiBottleRepository(() => null, products);

        const cellar = await cellars.createCellar("Weinregal");
        expect(isProvisional(cellar.getId())).toBe(true);

        const product = await products.save(new SoukaiProduct({name: "Barolo"}));
        const bottle = new SoukaiBottle({productUrl: (product as SoukaiProduct).url, cellarUrl: cellar.getId()});
        await bottles.save(bottle);

        const fetched = await bottles.fetchBottles();
        expect(fetched).toHaveLength(1);
        expect(fetched[0].getProduct().getName()).toBe("Barolo");
        expect(fetched[0].getCellar()).toBe(cellar.getId());

        const allCellars = await cellars.fetchCellars();
        expect(allCellars.map((c) => c.getName())).toContain("Weinregal");
    });

    it("creates both well-known cellars at startup, before any login (fixed slugs)", async () => {
        const cellars = new SoukaiCellarRepository(() => null);

        expect(cellars.getCellarWorkId()).toBe("local://cellars/cellarwork#it");
        expect(cellars.getAltglassId()).toBe("local://cellars/altglass#it");

        const all = await cellars.fetchCellars();
        const ids = all.map((c) => c.getId());
        expect(ids).toContain(cellars.getCellarWorkId());
        expect(ids).toContain(cellars.getAltglassId());
    });

    it("ensureWellKnownCellars is idempotent: no duplicates, preserves a renamed cellar", async () => {
        const cellars = new SoukaiCellarRepository(() => null);

        // Rename the cellarwork cellar, then re-verify (as container resolution does).
        const work = (await cellars.fetchCellarForCellarwork()) as SoukaiCellar;
        await work.update({name: "Mein Eingang"});
        await cellars.ensureWellKnownCellars();

        const all = await cellars.fetchCellars();
        const workCellars = all.filter((c) => c.getId() === cellars.getCellarWorkId());
        const altglassCellars = all.filter((c) => c.getId() === cellars.getAltglassId());
        expect(workCellars).toHaveLength(1);
        expect(altglassCellars).toHaveLength(1);
        expect(workCellars[0].getName()).toBe("Mein Eingang");
    });
});
