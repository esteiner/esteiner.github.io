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
import {bootModels, IndexedDBEngine, setEngine, withEngine, type Engine} from "soukai";
import {bootSolidModels} from "soukai-solid";

import {SoukaiCellar} from "./soukai/model/SoukaiCellar.ts";
import {SoukaiBottle} from "./soukai/model/SoukaiBottle.ts";
import {SoukaiProduct} from "./soukai/model/SoukaiProduct.ts";
import {SoukaiOrder} from "./soukai/model/SoukaiOrder.ts";
import {SoukaiOrderItem} from "./soukai/model/SoukaiOrderItem.ts";
import {SoukaiSeller} from "./soukai/model/SoukaiSeller.ts";
import {SoukaiCustomer} from "./soukai/model/SoukaiCustomer.ts";
import {SoukaiContactPoint} from "./soukai/model/SoukaiContactPoint.ts";
import {SoukaiOrderFactory} from "./soukai/model/SoukaiOrderFactory.ts";
import {SoukaiRating} from "./soukai/model/SoukaiRating.ts";

import {SoukaiCellarRepository} from "./soukai/SoukaiCellarRepository.ts";
import {SoukaiProductRepository} from "./soukai/SoukaiProductRepository.ts";
import {SoukaiBottleRepository} from "./soukai/SoukaiBottleRepository.ts";
import {SolidSyncService} from "./solid/SolidSyncService.ts";
import type {AuthService, SolidSession} from "../application/ports/AuthService.ts";
import type {Cellar} from "../domain/Cellar/Cellar.ts";
import {isProvisional, isPodUrl, rehomeUrl} from "./shared/resource-identity.ts";

bootSolidModels();
bootModels({SoukaiCellar, SoukaiBottle, SoukaiProduct, SoukaiOrder, SoukaiOrderItem, SoukaiSeller, SoukaiCustomer, SoukaiContactPoint, SoukaiRating});

const POD_BASE = "https://alice.pod/private/kellermeister/v1/";

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

        const product = await products.save(new SoukaiProduct({name: "Rioja Reserva 2019", weinname: "Rioja"}));
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
        // km:weinname survives the sync to the Pod.
        expect((b.getProduct() as SoukaiProduct).getWineName()).toBe("Rioja");

        // Idempotent: a second sync creates no duplicates.
        await newSyncService(POD_BASE).synchronize();
        const afterSecond = await new SoukaiBottleRepository(() => POD_BASE, new SoukaiProductRepository(() => POD_BASE)).fetchBottles();
        expect(afterSecond).toHaveLength(1);
    });

    // Well-known cellars -----------------------------------------------------
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

    // Embedded order parts survive sync -------------------------------------
    it("syncs an order with its embedded seller, customer, and items to the Pod (idempotent)", async () => {
        const products = new SoukaiProductRepository(() => null);
        const p1 = (await products.save(new SoukaiProduct({name: "Barolo"}))) as SoukaiProduct;
        const p2 = (await products.save(new SoukaiProduct({name: "Rioja"}))) as SoukaiProduct;

        // Build an order that embeds its seller, customer, and two items (each
        // referencing a provisional local product), then save it locally — the
        // shape ingestion produces.
        const order = new SoukaiOrder({orderNumber: "A-1"});
        order.seller = new SoukaiSeller({name: "Weinhaus", email: "s@x.ch", homepage: "https://weinhaus.ch"});
        order.customer = new SoukaiCustomer({name: "Alice", email: "a@x.ch"});
        for (const [q, p] of [[2, p1], [1, p2]] as const) {
            const item = new SoukaiOrderItem({orderQuantity: q, price: 10, priceCurrency: "CHF", productUrl: p.url});
            item.relatedOrder.addRelated(order);
            order.addOrderItem(item);
        }
        order.mintUrl("local://orders/o1", false, "it");
        await order.save();

        // First sync: re-home the products and the order (embedding its parts).
        await newSyncService(POD_BASE).synchronize();

        const readPodOrders = async (): Promise<SoukaiOrder[]> =>
            withEngine(remoteEngine, async () => {
                const orders = (await SoukaiOrder.from(`${POD_BASE}orders/`).all()) as SoukaiOrder[];
                for (const o of orders) {
                    await o.loadRelation("seller");
                    await o.loadRelation("customer");
                    await o.loadRelation("positions");
                }
                return orders;
            });

        const podOrders = await readPodOrders();
        expect(podOrders).toHaveLength(1);
        const podOrder = podOrders[0];
        const docUrl = podOrder.getId().split("#")[0];

        // Seller, customer, and both items are present and in the one document.
        expect(isPodUrl(podOrder.getId())).toBe(true);
        expect(podOrder.getSeller()?.getName()).toBe("Weinhaus");
        expect(podOrder.getSeller()?.getUrl()).toBe("https://weinhaus.ch");
        expect(podOrder.getCustomer()?.getName()).toBe("Alice");
        expect(podOrder.getOrderItems()).toHaveLength(2);
        expect(podOrder.getSeller()?.getId().split("#")[0]).toBe(docUrl);
        expect(podOrder.getCustomer()?.getId().split("#")[0]).toBe(docUrl);
        for (const item of podOrder.getOrderItems() as SoukaiOrderItem[]) {
            expect(item.getId().split("#")[0]).toBe(docUrl);
            // Item references the re-homed Pod product, not the local:// URL.
            expect(isPodUrl(item.productUrl!)).toBe(true);
        }
        const podProductUrls = (podOrder.getOrderItems() as SoukaiOrderItem[]).map((i) => i.productUrl).sort();
        expect(podProductUrls).toEqual([rehomeUrl(POD_BASE, p1.url), rehomeUrl(POD_BASE, p2.url)].sort());

        // Idempotent: a second sync creates no duplicate order and preserves parts.
        await newSyncService(POD_BASE).synchronize();
        const afterSecond = await readPodOrders();
        expect(afterSecond).toHaveLength(1);
        expect(afterSecond[0].getOrderItems()).toHaveLength(2);
        expect(afterSecond[0].getSeller()?.getName()).toBe("Weinhaus");
        expect(afterSecond[0].getCustomer()?.getName()).toBe("Alice");
    });

    // Customer contactPoint survives sync -----------------------------------
    it("syncs the customer's nested contactPoint (name/email) to the Pod", async () => {
        // Source order as read from the inbox: the customer's email lives on a
        // nested schema:ContactPoint. Build the processed order via the factory
        // (the ingestion path) so contactPoint preservation is exercised too.
        const source = new SoukaiOrder({orderNumber: "A-1"});
        const sourceCustomer = new SoukaiCustomer({name: "Sonja Steiner", address: "Morgartenstrasse 9, 6003 Luzern, Schweiz"});
        sourceCustomer.contactPoint = new SoukaiContactPoint({name: "Sonja Steiner", email: "sonja.steiner@acons.ch"});
        source.customer = sourceCustomer;

        const built = new SoukaiOrderFactory().createOrder(source) as SoukaiOrder;
        // Factory preserved the contactPoint (not flattened onto the customer).
        expect(built.getCustomer()?.getEmail()).toBe("sonja.steiner@acons.ch");
        built.mintUrl("local://orders/o-cp", false, "it");
        await built.save();

        await newSyncService(POD_BASE).synchronize();

        const [podOrder] = await withEngine(remoteEngine, async () => {
            const orders = (await SoukaiOrder.from(`${POD_BASE}orders/`).all()) as SoukaiOrder[];
            for (const o of orders) {
                await o.loadRelation("customer");
                await o.customer?.loadRelation("contactPoint");
            }
            return orders;
        });

        const customer = podOrder.getCustomer() as SoukaiCustomer;
        expect(isPodUrl(customer.getId())).toBe(true);
        expect(customer.getName()).toBe("Sonja Steiner");
        // The Organization's own address (a direct field, not on the contactPoint).
        expect(customer.getAddress()).toBe("Morgartenstrasse 9, 6003 Luzern, Schweiz");
        // Email comes from the embedded contactPoint on the Pod.
        expect(customer.contactPoint?.getEmail()).toBe("sonja.steiner@acons.ch");
        expect(customer.getEmail()).toBe("sonja.steiner@acons.ch");
        // contactPoint is embedded in the same document as the order.
        const docUrl = podOrder.getId().split("#")[0];
        expect(customer.contactPoint?.url.split("#")[0]).toBe(docUrl);
    });

    // Concurrency ------------------------------------------------------------
    it("keeps local reads local while a sync holds the Pod engine", async () => {
        const cellars = new SoukaiCellarRepository(() => POD_BASE);
        await cellars.fetchCellars(); // let the startup bootstrap settle

        // A Pod engine that records what it is asked to read and — on its first
        // read — fires a local read and holds the Pod window open around it.
        // That is exactly the window in which an ungated local read is misrouted
        // to the Pod (as `local://cellars/`, which the Pod cannot fetch).
        const containersRead: string[] = [];
        let localRead: Promise<Cellar[]> | null = null;
        const slowRemote: Engine = {
            create: (collection, document, id) => remoteEngine.create(collection, document, id),
            readOne: (collection, id) => remoteEngine.readOne(collection, id),
            readMany: async (collection, filters) => {
                containersRead.push(collection);
                if (!localRead) {
                    localRead = cellars.fetchCellars();
                    await new Promise((resolve) => setTimeout(resolve, 10));
                }
                return await remoteEngine.readMany(collection, filters);
            },
            update: (collection, id, updates) => remoteEngine.update(collection, id, updates),
            delete: (collection, id) => remoteEngine.delete(collection, id),
        };

        await new SolidSyncService(loggedInAuth, () => POD_BASE, (): Engine => slowRemote).synchronize();
        const found = await localRead!;

        // No `local://…` container was ever sent to the Pod engine.
        expect(containersRead.filter((container) => !container.startsWith(POD_BASE))).toEqual([]);
        expect(found.map((cellar) => cellar.getName()).sort()).toEqual(["Altglass", "Eingang"]);
    });
});
