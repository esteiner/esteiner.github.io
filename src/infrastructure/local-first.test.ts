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
import {SoukaiOrderRepository} from "./soukai/SoukaiOrderRepository.ts";
import {SoukaiBottleFactory} from "./soukai/model/SoukaiBottleFactory.ts";
import {SoukaiOrderFactory} from "./soukai/model/SoukaiOrderFactory.ts";
import {SoukaiProductFactory} from "./soukai/model/SoukaiProductFactory.ts";
import {KellermeisterService} from "../application/KellermeisterService.ts";
import type {AuthService, SolidSession} from "../application/ports/AuthService.ts";
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

    it("a read-back product resolves its order's seller (product → orderItem → order → seller)", async () => {
        // Regression for the empty "Quelle" in product-component: a product must
        // keep a resolvable back-link to the order it came from, so the seller name
        // is available on read (previously the link was never persisted or loaded).
        const loggedOut: AuthService = {
            isLoggedIn: () => false,
            getSession: () => ({isLoggedIn: false, webId: null, fetch}) as SolidSession,
        };
        const cellars = new SoukaiCellarRepository(() => null);
        const products = new SoukaiProductRepository(() => null);
        const bottles = new SoukaiBottleRepository(() => null, products);
        const orders = new SoukaiOrderRepository(() => null, () => null, loggedOut);
        const service = new KellermeisterService(
            cellars, bottles, products, orders,
            new SoukaiBottleFactory(), new SoukaiOrderFactory(), new SoukaiProductFactory(),
        );

        // A source order with a seller, materialized from Turtle like the real
        // conversion/inbox path produces.
        const ttl = `
@prefix schema: <https://schema.org/> .
@prefix km: <https://vocab.kellermeister.ch/wine/> .
<https://kellermeister.ch/orders/t/1> a schema:OrderItem ;
    schema:orderQuantity 2 ;
    schema:orderedItem <https://kellermeister.ch/products/t> .
<https://kellermeister.ch/products/t> a schema:Product ;
    schema:name "Barolo" ; km:weinname "Nebbiolo" .
<https://www.seller.ch/t> a schema:Organization ;
    schema:name "Weinhaus Test" ; schema:email "info@seller.ch" .
<https://kellermeister.ch/orders/t> a schema:Order ;
    schema:orderNumber "T-1" ;
    schema:seller <https://www.seller.ch/t> ;
    schema:orderedItem <https://kellermeister.ch/orders/t/1> .
`;
        const [sourceOrder] = await orders.parseOrders(ttl);
        expect(sourceOrder.getSeller()?.getName()).toBe("Weinhaus Test");

        await service.ingestOrder(sourceOrder, cellars.getCellarWorkId());

        // Read products back the way the cellar view does, and walk the chain.
        const readBack = await products.fetchAll();
        const barolo = readBack.find((p) => p.getName() === "Barolo") as SoukaiProduct;
        expect(barolo).toBeDefined();
        // The back-link is persisted to the order item's document (the order).
        expect(barolo.orderItemUrl).toBeTruthy();
        expect(barolo.orderItemUrl?.startsWith("local://orders/")).toBe(true);
        // And the whole chain resolves to the seller's name.
        expect(barolo.getOrderItem()?.getOrder()?.getSeller()?.getName()).toBe("Weinhaus Test");

        // The order view reads via fetchOrders; its item's product must resolve the
        // same chain (product-component walks product → orderItem → order → seller).
        const [readOrder] = await orders.fetchOrders();
        const item = readOrder.getOrderItems()[0];
        expect(item.getProduct().getOrderItem()?.getOrder()?.getSeller()?.getName()).toBe("Weinhaus Test");
    });
});
