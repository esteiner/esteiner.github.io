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
 * Seed an inbox order shaped like the real pipeline's output (see
 * notes/data/inbox-orders/...): the order references a seller AND a customer,
 * both authored as `schema:Organization` nodes in the same document. Authored as
 * a raw engine document — NOT via the Soukai models — so the customer's RDF type
 * comes from the data, not from `SoukaiCustomer`'s own declaration. This is what
 * exposes a customer/seller rdfsClass mismatch on read-back.
 */
async function seedInboxWithParties(slug: string, orderNumber: string): Promise<void> {
    const doc = `${INBOX}${slug}`;
    const ctx = {"@vocab": "https://schema.org/"};
    await inboxEngine.createDocument(doc, {
        "@graph": [
            {
                "@context": ctx,
                "@id": `${doc}#it`,
                "@type": "Order",
                orderNumber,
                seller: {"@id": `${doc}#seller`},
                customer: {"@id": `${doc}#customer`},
            },
            {"@context": ctx, "@id": `${doc}#seller`, "@type": "Organization", name: "Boucherville AG", email: "info@boucherville.ch", url: {"@id": "https://www.boucherville.ch"}},
            // Customer: name + address on the Organization; email only on the nested ContactPoint.
            {"@context": ctx, "@id": `${doc}#customer`, "@type": "Organization", name: "Sonja Steiner", address: "Morgartenstrasse 9, 6003 Luzern, Schweiz", contactPoint: {"@id": `${doc}#contact`}},
            {"@context": ctx, "@id": `${doc}#contact`, "@type": "ContactPoint", name: "Sonja Steiner", email: "sonja.steiner@acons.ch"},
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
