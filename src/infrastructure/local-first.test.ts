/**
 * Acceptance tests for the local-first / per-resource + sync behavior.
 *
 * Uses the REAL repositories and SolidSyncService against IndexedDBEngine
 * (fake-indexeddb). The "Pod" is simulated by a second IndexedDBEngine injected
 * into the sync service — see the save spike for why history/sync must run on
 * IndexedDBEngine rather than InMemoryEngine.
 */
import "fake-indexeddb/auto";
import {describe, it, expect, beforeEach} from "vitest";
import {bootModels, IndexedDBEngine, setEngine, type Engine} from "soukai";
import {bootSolidModels} from "soukai-solid";

import {SoukaiCellar} from "./soukai/model/SoukaiCellar.ts";
import {SoukaiBottle} from "./soukai/model/SoukaiBottle.ts";
import {SoukaiProduct} from "./soukai/model/SoukaiProduct.ts";
import {SoukaiOrder} from "./soukai/model/SoukaiOrder.ts";
import {SoukaiOrderItem} from "./soukai/model/SoukaiOrderItem.ts";
import {SoukaiSeller} from "./soukai/model/SoukaiSeller.ts";
import {SoukaiRating} from "./soukai/model/SoukaiRating.ts";

import {SoukaiCellarRepository} from "./soukai/SoukaiCellarRepository.ts";
import {SoukaiProductRepository} from "./soukai/SoukaiProductRepository.ts";
import {SoukaiBottleRepository} from "./soukai/SoukaiBottleRepository.ts";
import {SolidSyncService} from "./solid/SolidSyncService.ts";
import type {AuthService, SolidSession} from "../application/ports/AuthService.ts";
import {isProvisional, isPodUrl} from "./shared/resource-identity.ts";

bootSolidModels();
bootModels({SoukaiCellar, SoukaiBottle, SoukaiProduct, SoukaiOrder, SoukaiOrderItem, SoukaiSeller, SoukaiRating});

const POD_BASE = "https://alice.pod/kellermeister/";

let dbCounter = 0;
let localEngine: IndexedDBEngine;
let remoteEngine: IndexedDBEngine;

beforeEach(() => {
    localEngine = new IndexedDBEngine(`local-${dbCounter}`);
    remoteEngine = new IndexedDBEngine(`remote-${dbCounter}`);
    dbCounter++;
    setEngine(localEngine);
});

const loggedInAuth: AuthService = {
    isLoggedIn: () => true,
    getSession: (): SolidSession => ({isLoggedIn: true, webId: "https://alice.pod/profile#me", fetch}),
};

function newSyncService(base: string | null): SolidSyncService {
    return new SolidSyncService(loggedInAuth, () => base, (): Engine => remoteEngine);
}

describe("local-first acceptance", () => {

    // Task 6.1 --------------------------------------------------------------
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

    // Task 6.3 --------------------------------------------------------------
    it("re-homes provisional resources to Pod URLs and rewrites cross-references, idempotently", async () => {
        const products = new SoukaiProductRepository(() => null);
        const bottles = new SoukaiBottleRepository(() => null, products);

        const product = await products.save(new SoukaiProduct({name: "Rioja"}));
        const provisionalProductUrl = (product as SoukaiProduct).url;
        const bottle = new SoukaiBottle({productUrl: provisionalProductUrl, cellarUrl: "local://cellars/altglass#it"});
        await bottles.save(bottle);

        // First sync: re-home + push.
        const sync = newSyncService(POD_BASE);
        await sync.synchronize();

        const rehomedBottles = await new SoukaiBottleRepository(() => POD_BASE, new SoukaiProductRepository(() => POD_BASE)).fetchBottles();
        expect(rehomedBottles).toHaveLength(1);
        const b = rehomedBottles[0] as SoukaiBottle;
        expect(isPodUrl(b.getId())).toBe(true);
        // Reference rewritten to the product's Pod URL (deterministic).
        expect(b.productUrl).toBe(provisionalProductUrl.replace("local://", POD_BASE));
        expect(b.getCellar()).toBe(`${POD_BASE}cellars/altglass#it`);
        expect(isPodUrl((b.getProduct() as SoukaiProduct).url)).toBe(true);

        // Idempotent: a second sync creates no duplicates.
        await newSyncService(POD_BASE).synchronize();
        const afterSecond = await new SoukaiBottleRepository(() => POD_BASE, new SoukaiProductRepository(() => POD_BASE)).fetchBottles();
        expect(afterSecond).toHaveLength(1);
    });

    // Task 6.4 --------------------------------------------------------------
    it("propagates a deletion to the Pod and does not resurrect it", async () => {
        const products = new SoukaiProductRepository(() => null);
        const bottles = new SoukaiBottleRepository(() => null, products);

        const product = await products.save(new SoukaiProduct({name: "Chianti"}));
        const bottle = new SoukaiBottle({productUrl: (product as SoukaiProduct).url, cellarUrl: "local://cellars/c1#it"});
        await bottles.save(bottle);

        // First sync pushes it to the Pod.
        await newSyncService(POD_BASE).synchronize();

        // Delete locally (soft delete) and sync again.
        const podBottles = new SoukaiBottleRepository(() => POD_BASE, new SoukaiProductRepository(() => POD_BASE));
        const live = await podBottles.fetchBottles();
        expect(live).toHaveLength(1);
        await podBottles.delete(live[0]);
        await newSyncService(POD_BASE).synchronize();

        // Gone locally and not resurrected by a further sync.
        expect(await podBottles.fetchBottles()).toHaveLength(0);
        await newSyncService(POD_BASE).synchronize();
        expect(await podBottles.fetchBottles()).toHaveLength(0);
    });
});
