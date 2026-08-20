import "fake-indexeddb/auto";
import {describe, it, expect, beforeEach} from "vitest";
import {IndexedDbAppStateStore} from "./IndexedDbAppStateStore.ts";

function freshDb(): Promise<void> {
    return new Promise((resolve) => {
        const req = indexedDB.deleteDatabase("kellermeister-appstate");
        req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
}

describe("IndexedDbAppStateStore", () => {
    let store: IndexedDbAppStateStore;

    beforeEach(async () => {
        await freshDb();
        store = new IndexedDbAppStateStore();
    });

    it("returns null for unset values", async () => {
        expect(await store.getWebId()).toBeNull();
        expect(await store.getLastSyncedAt()).toBeNull();
    });

    it("round-trips the WebID", async () => {
        await store.setWebId("https://alice.pod/profile#me");
        expect(await store.getWebId()).toBe("https://alice.pod/profile#me");
    });

    it("round-trips the last sync date (Date in -> Date out)", async () => {
        const when = new Date("2026-08-20T10:30:00.000Z");
        await store.setLastSyncedAt(when);
        const read = await store.getLastSyncedAt();
        expect(read).toBeInstanceOf(Date);
        expect(read?.getTime()).toBe(when.getTime());
    });

    it("persists across store instances (survives a reload)", async () => {
        await store.setWebId("https://bob.pod/profile#me");
        await store.setLastSyncedAt(new Date("2026-01-02T03:04:05.000Z"));

        const reopened = new IndexedDbAppStateStore();
        expect(await reopened.getWebId()).toBe("https://bob.pod/profile#me");
        expect((await reopened.getLastSyncedAt())?.toISOString()).toBe("2026-01-02T03:04:05.000Z");
    });
});
