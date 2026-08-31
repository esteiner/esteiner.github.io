/**
 * Tests for inbox order ingestion in SoukaiOrderRepository.
 *
 * The Pod inbox is simulated with a second (isolated) InMemoryEngine injected via
 * the `inboxEngine` factory. `deleteSolidDataset` (the real Pod deletion) is
 * mocked, since there is no Solid endpoint to delete against.
 */
import {describe, it, expect, beforeEach, vi} from "vitest";
import {InMemoryEngine, runWithEngine} from "soukai-bis";
import {installMemoryEngine, createMemoryEngine} from "../../testing/soukai.ts";

vi.mock("@inrupt/solid-client", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@inrupt/solid-client")>()),
    deleteSolidDataset: vi.fn(async () => {}),
}));
import {deleteSolidDataset} from "@inrupt/solid-client";

import {SoukaiOrder} from "./model/SoukaiOrder.ts";
import {SoukaiOrderItem} from "./model/SoukaiOrderItem.ts";
import {SoukaiProduct} from "./model/SoukaiProduct.ts";
import {SoukaiOrderFactory} from "./model/SoukaiOrderFactory.ts";
import {SoukaiProductFactory} from "./model/SoukaiProductFactory.ts";
import {SoukaiBottleFactory} from "./model/SoukaiBottleFactory.ts";
import {SoukaiProductRepository} from "./SoukaiProductRepository.ts";
import {SoukaiBottleRepository} from "./SoukaiBottleRepository.ts";
import {SoukaiOrderRepository} from "./SoukaiOrderRepository.ts";
import type {AuthService, SolidSession} from "../../application/ports/AuthService.ts";
import type {Order} from "../../domain/Order/Order.ts";
import type {OrderItem} from "../../domain/Order/OrderItem.ts";

const INBOX = "https://alice.pod/inbox/kellermeister/";

let inboxEngine: InMemoryEngine;

beforeEach(() => {
    installMemoryEngine();
    inboxEngine = createMemoryEngine();
    vi.mocked(deleteSolidDataset).mockClear();
});

const authFetch = (async () => new Response()) as unknown as typeof fetch;

function auth(isLoggedIn: boolean): AuthService {
    const session: SolidSession = {
        isLoggedIn,
        webId: isLoggedIn ? "https://alice.pod/profile#me" : null,
        fetch: authFetch,
    };
    return {isLoggedIn: () => isLoggedIn, getSession: () => session};
}

function makeRepo(loggedIn: boolean, inbox: string | null): SoukaiOrderRepository {
    return new SoukaiOrderRepository(() => null, () => inbox, auth(loggedIn), () => inboxEngine);
}

async function seedInbox(slug: string, orderNumber: string): Promise<void> {
    await runWithEngine(inboxEngine, () => new SoukaiOrder({url: `${INBOX}${slug}#it`, orderNumber}).save());
}

/**
 * Seed an inbox order shaped like the REAL pipeline's output (see
 * notes/data/inbox-orders/... and community-solid-server/.volumes/data/edwin/
 * inbox/kellermeister/): every part — order, order item, product, seller,
 * customer, and the customer's contactPoint — is embedded in the single inbox
 * document, but each is identified by a synthetic, non-dereferenceable ABSOLUTE
 * URL on a foreign host (`https://kellermeister.ch/…`, `https://www.boucherville.ch`).
 *
 * Using foreign absolute URLs (not same-document `#hash` fragments) is essential:
 * it exercises the no-fetch path. A `#hash` fixture would let soukai-bis resolve
 * the parts as same-document and mask the regression where relation-loading tries
 * to dereference the identifiers (CORS-blocked in the browser).
 */
async function seedInboxWithParties(slug: string, orderNumber: string): Promise<void> {
    const doc = `${INBOX}${slug}`;
    const ctx = {"@vocab": "https://schema.org/", km: "https://vocab.kellermeister.ch/wine/"};
    // Slug-scoped foreign identifiers so multiple seeded docs never collide.
    const order = `https://kellermeister.ch/orders/${slug}`;
    const item = `https://kellermeister.ch/orders/${slug}/1`;
    const product = `https://kellermeister.ch/products/${slug}`;
    const seller = `https://www.boucherville.ch/${slug}`;
    const customer = `https://schema.org/organization/${slug}`;
    const contact = `https://schema.org/organization/${slug}/contact`;
    await inboxEngine.createDocument(doc, {
        "@graph": [
            {
                "@context": ctx,
                "@id": order,
                "@type": "Order",
                orderNumber,
                seller: {"@id": seller},
                customer: {"@id": customer},
                orderedItem: {"@id": item},
            },
            {"@context": ctx, "@id": item, "@type": "OrderItem", orderQuantity: 6, price: 90, priceCurrency: "CHF", orderedItem: {"@id": product}},
            {"@context": ctx, "@id": product, "@type": "Product", name: "Dhondt-Grellet Les Terres Fines 2021", "km:weinname": "Les Terres Fines"},
            {"@context": ctx, "@id": seller, "@type": "Organization", name: "Boucherville AG", email: "info@boucherville.ch", url: {"@id": "https://www.boucherville.ch"}},
            // Customer: name + address on the Organization; email only on the nested ContactPoint.
            {"@context": ctx, "@id": customer, "@type": "Organization", name: "Sonja Steiner", address: "Morgartenstrasse 9, 6003 Luzern, Schweiz", contactPoint: {"@id": contact}},
            {"@context": ctx, "@id": contact, "@type": "ContactPoint", name: "Sonja Steiner", email: "sonja.steiner@acons.ch"},
        ],
    });
}

describe("SoukaiOrderRepository inbox ingestion", () => {

    it("returns no unprocessed orders when logged out", async () => {
        await seedInbox("order-1", "A-1");
        const repo = makeRepo(false, INBOX);
        expect(await repo.fetchUnprocessedOrders()).toEqual([]);
    });

    it("returns no unprocessed orders when the inbox container is unresolved", async () => {
        await seedInbox("order-1", "A-1");
        const repo = makeRepo(true, null);
        expect(await repo.fetchUnprocessedOrders()).toEqual([]);
    });

    it("reads unprocessed orders from the Pod inbox when logged in", async () => {
        await seedInbox("order-1", "A-1");
        const repo = makeRepo(true, INBOX);

        const orders = await repo.fetchUnprocessedOrders();
        expect(orders).toHaveLength(1);
        expect(orders[0].getOrderNumber()).toBe("A-1");
    });

    it("loads the seller and the customer (with contactPoint name/email) from the inbox", async () => {
        // Real inbox orders model the customer (like the seller) as a
        // schema:Organization — SoukaiCustomer must match that type or the
        // customer relation silently loads as undefined. The customer's email
        // lives on a nested schema:ContactPoint, not on the Organization node.
        await seedInboxWithParties("order-parties", "A-9");
        const repo = makeRepo(true, INBOX);

        const [order] = await repo.fetchUnprocessedOrders();
        expect(order.getSeller()?.getName()).toBe("Boucherville AG");
        expect(order.getSeller()?.getUrl()).toBe("https://www.boucherville.ch");
        expect(order.getCustomer()?.getName()).toBe("Sonja Steiner");
        expect(order.getCustomer()?.getEmail()).toBe("sonja.steiner@acons.ch");
        expect(order.getCustomer()?.getAddress()).toBe("Morgartenstrasse 9, 6003 Luzern, Schweiz");
    });

    it("resolves each item's embedded product from the inbox document (no dereferencing)", async () => {
        // The order item and its product are embedded in the one inbox document
        // under foreign, non-dereferenceable identifiers. They must be read from
        // the document graph — never fetched (which would CORS-fail in the browser).
        await seedInboxWithParties("order-embedded", "A-10");
        const repo = makeRepo(true, INBOX);

        const [order] = await repo.fetchUnprocessedOrders();
        const items = order.getOrderItems();
        expect(items).toHaveLength(1);
        expect(items[0].getOrderQuantity()).toBe(6);
        // The product (referenced by the item via a foreign URL) resolves from
        // the same document, so getProduct() returns it.
        expect(items[0].getProduct()?.getName()).toBe("Dhondt-Grellet Les Terres Fines 2021");
        expect(items[0].getProduct()?.getWineName()).toBe("Les Terres Fines");
    });

    it("deleteFromInbox deletes the source document with the authenticated fetch", async () => {
        await seedInbox("order-2", "A-2");
        const repo = makeRepo(true, INBOX);
        const [order] = await repo.fetchUnprocessedOrders();

        await repo.deleteFromInbox(order);

        expect(deleteSolidDataset).toHaveBeenCalledTimes(1);
        const [url, options] = vi.mocked(deleteSolidDataset).mock.calls[0];
        expect(url).toContain(`${INBOX}order-2`);
        expect(options).toEqual({fetch: authFetch});
    });

    it("deleteFromInbox deletes the inbox FILE, not the order's synthetic identifier", async () => {
        // Real inbox orders have a synthetic identifier (https://kellermeister.ch/
        // orders/…) that is NOT the inbox document. Deleting must target the file
        // the order was read from, never the identifier (which would CORS-fail).
        await seedInboxWithParties("order-del", "A-11");
        const repo = makeRepo(true, INBOX);
        const [order] = await repo.fetchUnprocessedOrders();

        await repo.deleteFromInbox(order);

        expect(deleteSolidDataset).toHaveBeenCalledTimes(1);
        const [url] = vi.mocked(deleteSolidDataset).mock.calls[0];
        expect(url).toBe(`${INBOX}order-del`);
        expect(url).not.toContain("kellermeister.ch");
    });

    it("deleteFromInbox is a no-op when logged out", async () => {
        await seedInbox("order-3", "A-3");
        const [order] = await makeRepo(true, INBOX).fetchUnprocessedOrders();

        await makeRepo(false, INBOX).deleteFromInbox(order);

        expect(deleteSolidDataset).not.toHaveBeenCalled();
    });
});

describe("SoukaiOrderRepository same-document embedding", () => {

    const factory = new SoukaiOrderFactory();

    function sourceOrder(withCustomer: boolean): Order {
        const item = {
            getOrderQuantity: () => 2,
            getPrice: () => 10,
            getPriceCurrency: () => "CHF",
            getProduct: () => ({getName: () => "Barolo"}),
        } as unknown as OrderItem;
        return {
            getOrderDate: () => undefined,
            getOrderNumber: () => "A-1",
            getSeller: () => ({getId: () => "", getName: () => "Weinhaus", getEmail: () => "s@x.ch", getUrl: () => "https://weinhaus.ch"}),
            getCustomer: () => withCustomer
                ? {getId: () => "", getName: () => "Alice", getEmail: () => "a@x.ch", getAddress: () => "Bahnhofstrasse 1, 8001 Zürich"}
                : undefined,
            getOrderItems: () => [item],
        } as unknown as Order;
    }

    it("builds a bottle from a product then assigns its cellar, and saves it", async () => {
        // Exercises the REAL (un-mocked) ingestion bottle path: the factory builds
        // a bottle from the product with NO cellar yet, then `setCellar` assigns it
        // before save. Regression guard: soukai-bis validates required fields at
        // construction, so `cellarUrl` must be optional or `new SoukaiBottle()`
        // in the factory throws (the KellermeisterService test mocks the factories
        // and so never covered this).
        installMemoryEngine();
        const products = new SoukaiProductRepository(() => null);
        const saved = await products.save(new SoukaiProduct({name: "Barolo"}));

        const bottle = new SoukaiBottleFactory().createFromProduct(saved);
        bottle.setCellar("local://cellars/cellarwork#it");
        const bottles = new SoukaiBottleRepository(() => null, products);
        await bottles.saveAll([bottle]);

        const [fetched] = await bottles.fetchBottles();
        expect(fetched.getCellar()).toBe("local://cellars/cellarwork#it");
        expect(fetched.getProduct().getName()).toBe("Barolo");
    });

    it("copies seller and customer into the freshly-built order", () => {
        const built = factory.createOrder(sourceOrder(true)) as SoukaiOrder;
        expect(built.getSeller()?.getName()).toBe("Weinhaus");
        expect(built.getCustomer()?.getName()).toBe("Alice");
    });

    it("tolerates a source order without a customer", () => {
        const built = factory.createOrder(sourceOrder(false)) as SoukaiOrder;
        expect(built.getSeller()?.getName()).toBe("Weinhaus");
        expect(built.getCustomer()).toBeUndefined();
    });

    it("copies the wine name (km:weinname) into the freshly-built product", () => {
        const source = new SoukaiProduct({name: "Dhondt-Grellet Les Terres Fines 2021", weinname: "Les Terres Fines"});
        const item = new SoukaiOrderItem({price: 90, priceCurrency: "CHF"});
        const built = new SoukaiProductFactory().createProduct(source, item) as SoukaiProduct;
        expect(built.getName()).toBe("Dhondt-Grellet Les Terres Fines 2021");
        expect(built.getWineName()).toBe("Les Terres Fines");
    });

    it("persists order, seller, customer, and items in one document referencing the local product", async () => {
        const source = sourceOrder(true);
        const built = factory.createOrder(source) as SoukaiOrder;
        const item = factory.createOrderItem(source.getOrderItems()[0], built);
        built.addOrderItem(item);
        const product = await new SoukaiProduct({url: "local://products/p1", name: "Barolo"}).save();
        factory.linkProduct(item, product);

        const repo = makeRepo(true, null);
        const saved = await repo.saveProcessedOrder(built);

        const fetched = (await repo.fetchOrders()) as SoukaiOrder[];
        const order = fetched.find((o) => o.getId() === saved.getId()) as SoukaiOrder;
        const docUrl = order.getId().split("#")[0];

        expect(order.getSeller()?.getName()).toBe("Weinhaus");
        expect(order.getCustomer()?.getName()).toBe("Alice");
        // No source contactPoint here, so the email is copied directly onto the
        // customer node (contactPoint preservation is covered in local-first.test).
        expect(order.getCustomer()?.getEmail()).toBe("a@x.ch");
        expect(order.getCustomer()?.getAddress()).toBe("Bahnhofstrasse 1, 8001 Zürich");
        expect(order.getOrderItems()).toHaveLength(1);
        expect(order.getSeller()?.getId().split("#")[0]).toBe(docUrl);
        expect(order.getCustomer()?.getId().split("#")[0]).toBe(docUrl);
        expect(order.getOrderItems()[0].getId().split("#")[0]).toBe(docUrl);
        expect((order.getOrderItems()[0] as SoukaiOrderItem).productUrl).toBe("local://products/p1");
        // The order item's product (a separate resource) is resolved on read.
        expect((order.getOrderItems()[0] as SoukaiOrderItem).getProduct()?.getName()).toBe("Barolo");
    });
});
