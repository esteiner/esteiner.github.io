/**
 * Integration test for the dispose-to-Altglass rating flow.
 *
 * Unlike KellermeisterService.test.ts (which mocks every repository), this test
 * wires the REAL Soukai repositories against an in-memory engine so it exercises
 * actual persistence: `disposeBottleToAltglass` must store the rating VALUE on
 * the bottle and it must survive a reload.
 */
import {describe, it, expect, beforeEach, vi} from "vitest";
import {KellermeisterService} from "./KellermeisterService.ts";
import {installMemoryEngine} from "../testing/soukai.ts";
import {SoukaiProduct} from "../infrastructure/soukai/model/SoukaiProduct.ts";
import {SoukaiBottle} from "../infrastructure/soukai/model/SoukaiBottle.ts";
import {SoukaiProductRepository} from "../infrastructure/soukai/SoukaiProductRepository.ts";
import {SoukaiBottleRepository} from "../infrastructure/soukai/SoukaiBottleRepository.ts";
import {SoukaiBottleFactory} from "../infrastructure/soukai/model/SoukaiBottleFactory.ts";
import type {CellarRepository} from "../domain/Cellar/CellarRepository.ts";
import type {OrderRepository} from "../domain/Order/OrderRepository.ts";
import type {OrderFactory} from "../domain/Order/OrderFactory.ts";
import type {ProductFactory} from "../domain/Product/ProductFactory.ts";

vi.mock("@inrupt/solid-client", () => ({deleteSolidDataset: vi.fn()}));
vi.mock("@inrupt/solid-client-authn-browser", () => ({fetch: vi.fn()}));

const ALTGLASS = "local://cellars/altglass#it";
const CELLAR = "local://cellars/keller#it";

function makeService() {
    installMemoryEngine();
    const productRepo = new SoukaiProductRepository(() => null);
    const bottleRepo = new SoukaiBottleRepository(() => null, productRepo);
    const bottleFactory = new SoukaiBottleFactory();

    const cellarRepo = {
        getAltglassId: vi.fn().mockReturnValue(ALTGLASS),
        getCellarWorkId: vi.fn().mockReturnValue("cellarwork-id"),
    } as unknown as CellarRepository;
    const orderRepo = {} as unknown as OrderRepository;
    const orderFactory = {} as unknown as OrderFactory;
    const productFactory = {} as unknown as ProductFactory;

    const service = new KellermeisterService(
        cellarRepo, bottleRepo, productRepo, orderRepo, bottleFactory, orderFactory, productFactory,
    );
    return {service, productRepo, bottleRepo, bottleFactory};
}

async function seedBottle(deps: ReturnType<typeof makeService>): Promise<SoukaiBottle> {
    const product = await deps.productRepo.save(new SoukaiProduct({name: "Barolo"}));
    const bottle = deps.bottleFactory.createFromProduct(product);
    bottle.setCellar(CELLAR);
    await deps.bottleRepo.save(bottle);
    return bottle;
}

/** Reload the bottle from the store with its (same-document) rating resolved. */
async function reloadBottleWithRating(id: string): Promise<SoukaiBottle> {
    const fresh = await SoukaiBottle.find(id) as SoukaiBottle;
    await fresh.loadRelation("rating");
    return fresh;
}

describe("disposeBottleToAltglass rating", () => {

    beforeEach(() => {
        installMemoryEngine();
    });

    it("stores the rating value on the bottle when disposing to Altglass", async () => {
        const deps = makeService();
        const bottle = await seedBottle(deps);

        await deps.service.disposeBottleToAltglass(bottle, 2);

        const reloaded = await reloadBottleWithRating(bottle.getId());
        expect(reloaded.getCellar()).toBe(ALTGLASS);
        expect(reloaded.getRating()).toBeDefined();
        expect(reloaded.getRating()?.getValue()).toBe(2);
    });

    it("does not create a rating when no rating value is given", async () => {
        const deps = makeService();
        const bottle = await seedBottle(deps);

        await deps.service.disposeBottleToAltglass(bottle);

        const reloaded = await reloadBottleWithRating(bottle.getId());
        expect(reloaded.getCellar()).toBe(ALTGLASS);
        expect(reloaded.getRating()).toBeUndefined();
    });

    it("surfaces the bottle rating through the product's aggregated ratings (cellar view path)", async () => {
        const deps = makeService();
        const bottle = await seedBottle(deps);

        await deps.service.disposeBottleToAltglass(bottle, 3);

        // The cellar view reads bottles (with their products joined) via
        // fetchBottles, then displays product.getRatings() per product.
        const bottles = await deps.bottleRepo.fetchBottles();
        const disposed = bottles.find((candidate) => candidate.getId() === bottle.getId());
        const values = (disposed?.getProduct().getRatings() ?? []).map((rating) => rating.getValue());
        expect(values).toContain(3);
    });
});
