/**
 * Integration test for inline product editing: SoukaiProduct setters plus
 * KellermeisterService.updateProduct must persist edits that survive a reload.
 */
import {describe, it, expect, beforeEach, vi} from "vitest";
import {KellermeisterService} from "./KellermeisterService.ts";
import {installMemoryEngine} from "../testing/soukai.ts";
import {SoukaiProduct} from "../infrastructure/soukai/model/SoukaiProduct.ts";
import {SoukaiProductRepository} from "../infrastructure/soukai/SoukaiProductRepository.ts";
import type {CellarRepository} from "../domain/Cellar/CellarRepository.ts";
import type {BottleRepository} from "../domain/Bottle/BottleRepository.ts";
import type {OrderRepository} from "../domain/Order/OrderRepository.ts";
import type {BottleFactory} from "../domain/Bottle/BottleFactory.ts";
import type {OrderFactory} from "../domain/Order/OrderFactory.ts";
import type {ProductFactory} from "../domain/Product/ProductFactory.ts";

vi.mock("@inrupt/solid-client", () => ({deleteSolidDataset: vi.fn()}));
vi.mock("@inrupt/solid-client-authn-browser", () => ({fetch: vi.fn()}));

function makeService() {
    installMemoryEngine();
    const productRepo = new SoukaiProductRepository(() => null);
    const service = new KellermeisterService(
        {} as unknown as CellarRepository,
        {} as unknown as BottleRepository,
        productRepo,
        {} as unknown as OrderRepository,
        {} as unknown as BottleFactory,
        {} as unknown as OrderFactory,
        {} as unknown as ProductFactory,
    );
    return {service, productRepo};
}

describe("updateProduct (inline product edit)", () => {
    beforeEach(() => {
        installMemoryEngine();
    });

    it("persists edited detail fields so they survive a reload", async () => {
        const {service, productRepo} = makeService();
        const product = await productRepo.save(new SoukaiProduct({name: "Barolo"}));

        // Edit through the domain setters (as the inline editor does).
        product.setProducer("Gaja");
        product.setWineName("Barbaresco");
        product.setName("Gaja Barbaresco 2019"); // derived from producer + wine + year
        product.setRegion("Piemont");
        product.setCountry("Italien");
        product.setWineColor("rot");
        product.setAlcoholContent("14%");
        product.setVolumeMl(1500);
        product.setPrice(42);
        product.setProductionDate(new Date(2019, 0, 1));
        product.setDrinkingWindowFrom(new Date(2024, 0, 1));
        product.setDrinkingWindowTo(new Date(2030, 0, 1));

        await service.updateProduct(product);

        const reloaded = await SoukaiProduct.find(product.getId()) as SoukaiProduct;
        expect(reloaded.getProducer()).toBe("Gaja");
        expect(reloaded.getWineName()).toBe("Barbaresco");
        expect(reloaded.getName()).toBe("Gaja Barbaresco 2019");
        expect(reloaded.getRegion()).toBe("Piemont");
        expect(reloaded.getCountry()).toBe("Italien");
        expect(reloaded.getWineColor()).toBe("rot");
        expect(reloaded.getAlcoholContent()).toBe("14%");
        expect(reloaded.getVolumeMl()).toBe(1500);
        expect(reloaded.getPrice()).toBe(42);
        expect(reloaded.getProductionDate()?.getFullYear()).toBe(2019);
        expect(reloaded.getDrinkingWindowFrom()?.getFullYear()).toBe(2024);
        expect(reloaded.getDrinkingWindowTo()?.getFullYear()).toBe(2030);
    });
});
