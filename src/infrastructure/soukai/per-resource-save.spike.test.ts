/**
 * SPIKE (grounding, not a permanent spec): pins down soukai-solid's
 * cross-document save / re-hydrate / history / synchronize semantics with the
 * ACTUAL Kellermeister models, so the per-resource persistence layer is built
 * on confirmed behavior rather than assumptions.
 *
 * Delete once the real repository + sync tests cover these behaviors.
 */
import "fake-indexeddb/auto";
import {describe, it, expect, beforeEach} from "vitest";
import {bootModels, IndexedDBEngine, setEngine, withEngine} from "soukai";
import {bootSolidModels} from "soukai-solid";
import {SoukaiProduct} from "./model/SoukaiProduct.ts";
import {SoukaiBottle} from "./model/SoukaiBottle.ts";
import {SoukaiRating} from "./model/SoukaiRating.ts";
import {SoukaiCellar} from "./model/SoukaiCellar.ts";
import {SoukaiOrder} from "./model/SoukaiOrder.ts";
import {SoukaiOrderItem} from "./model/SoukaiOrderItem.ts";
import {SoukaiSeller} from "./model/SoukaiSeller.ts";

bootSolidModels();
bootModels({SoukaiCellar, SoukaiSeller, SoukaiOrder, SoukaiOrderItem, SoukaiProduct, SoukaiRating, SoukaiBottle});

const PRODUCTS = "local://products/";
const BOTTLES = "local://bottles/";

// A fresh IndexedDB database per test. NOTE: history/sync behavior must be
// exercised on IndexedDBEngine — InMemoryEngine does not re-materialize
// current state from the operation log on reload when `history: true`.
let dbCounter = 0;
beforeEach(() => {
    setEngine(new IndexedDBEngine(`spike-${dbCounter++}`));
});

describe("per-resource save semantics", () => {
    it("Q1: a Product saved to its own container is a separate document from a Bottle referencing it by URL", async () => {
        const product = await SoukaiProduct.at(PRODUCTS).create({name: "Wein"});
        const bottle = await SoukaiBottle.at(BOTTLES).create({productUrl: product.url, cellarUrl: "local://cellars/c1#it"});

        expect(product.url.startsWith(PRODUCTS)).toBe(true);
        expect(bottle.url.startsWith(BOTTLES)).toBe(true);
        // Distinct documents (different containers).
        expect(bottle.getDocumentUrl()).not.toBe(product.getDocumentUrl());
        expect(bottle.productUrl).toBe(product.url);
    });

    it("Q2: after reloading a Bottle from its container, its Product relation can be resolved", async () => {
        const product = await SoukaiProduct.at(PRODUCTS).create({name: "Wein"});
        await SoukaiBottle.at(BOTTLES).create({productUrl: product.url, cellarUrl: "local://cellars/c1#it"});

        const bottles = await SoukaiBottle.from(BOTTLES).all();
        expect(bottles).toHaveLength(1);
        const reloaded = bottles[0];
        await reloaded.loadRelation("product");
        expect(reloaded.product).toBeTruthy();
        expect(reloaded.product.getName()).toBe("Wein");
    });

    it("Q3: embedded Ratings persist in the SAME document as their Product", async () => {
        const product = new SoukaiProduct({name: "Wein"});
        product.url = `${PRODUCTS}p-rating#it`;
        product.createRating(5);
        await product.save();

        const reloaded = await SoukaiProduct.find(product.url);
        expect(reloaded).toBeTruthy();
        await reloaded!.loadRelation("ratings");
        expect(reloaded!.getRatings()).toHaveLength(1);
        const rating = reloaded!.getRatings()[0] as SoukaiRating;
        expect(rating.value).toBe(5);
        // Same document (rating is a fragment of the product resource).
        expect(rating.getDocumentUrl()).toBe(reloaded!.getDocumentUrl());
    });

    it("Q4: history is preserved across load-modify-save (operation log grows, not resets)", async () => {
        const product = await SoukaiProduct.at(PRODUCTS).create({name: "First"});
        const opsAfterCreate = product.operations?.length ?? 0;

        const loaded = await SoukaiProduct.find(product.url);
        await loaded!.update({name: "Second"}); // explicit soukai update API

        const reloaded = await SoukaiProduct.find(product.url);
        expect(reloaded!.getName()).toBe("Second");
        expect((reloaded!.operations?.length ?? 0)).toBeGreaterThan(opsAfterCreate);
    });

    it("Q5: synchronize() merges a soft delete between two independently-tracked replicas", async () => {
        const remoteEngine = new IndexedDBEngine("spike-remote");
        const localEngine = new IndexedDBEngine("spike-local");
        const url = `${PRODUCTS}sync#it`;

        // Both replicas created via normal saves (each carries its own history).
        let remote!: SoukaiProduct;
        await withEngine(remoteEngine, async () => {
            remote = await new SoukaiProduct({url, name: "Wein"}).save();
        });
        let local!: SoukaiProduct;
        await withEngine(localEngine, async () => {
            local = await new SoukaiProduct({url, name: "Wein"}).save();
        });

        // Soft-delete on the local replica.
        await withEngine(localEngine, () => local.delete());
        expect(local.isSoftDeleted()).toBe(true);

        // Merge operation logs: the soft delete must travel to the remote replica.
        await SoukaiProduct.synchronize(local, remote);
        expect(remote.isSoftDeleted()).toBe(true);
    });
});
