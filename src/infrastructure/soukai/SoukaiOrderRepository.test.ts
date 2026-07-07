/**
 * Tests for inbox order ingestion in SoukaiOrderRepository.
 *
 * The Pod inbox is simulated with a second IndexedDBEngine injected via the
 * `inboxEngine` factory (mirroring how local-first.test.ts simulates the Pod).
 * `deleteSolidDataset` (the real Pod deletion) is mocked, since fake-indexeddb
 * has no Solid endpoint to delete against.
 */
import "fake-indexeddb/auto";
import {describe, it, expect, beforeEach, vi} from "vitest";
import {bootModels, IndexedDBEngine, setEngine, withEngine} from "soukai";
import {bootSolidModels} from "soukai-solid";

vi.mock("@inrupt/solid-client", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@inrupt/solid-client")>()),
    deleteSolidDataset: vi.fn(async () => {}),
}));
import {deleteSolidDataset} from "@inrupt/solid-client";

import {SoukaiOrder} from "./model/SoukaiOrder.ts";
import {SoukaiOrderItem} from "./model/SoukaiOrderItem.ts";
import {SoukaiSeller} from "./model/SoukaiSeller.ts";
import {SoukaiOrderRepository} from "./SoukaiOrderRepository.ts";
import type {AuthService, SolidSession} from "../../application/ports/AuthService.ts";

bootSolidModels();
bootModels({SoukaiOrder, SoukaiOrderItem, SoukaiSeller});

const INBOX = "https://alice.pod/inbox/kellermeister/";

let dbCounter = 0;
let localEngine: IndexedDBEngine;
let inboxEngine: IndexedDBEngine;

beforeEach(() => {
    localEngine = new IndexedDBEngine(`local-order-${dbCounter}`);
    inboxEngine = new IndexedDBEngine(`inbox-order-${dbCounter}`);
    dbCounter++;
    setEngine(localEngine);
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
    await withEngine(inboxEngine, () => new SoukaiOrder({url: `${INBOX}${slug}#it`, orderNumber}).save());
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
