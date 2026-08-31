/**
 * Verifies the real wipe against fake-indexeddb: the domain data and app-state
 * database go, the Pod container base goes (in localStorage AND in memory), and
 * the login WebID list survives.
 */
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {getEngine, IndexedDBEngine} from "soukai-bis";

import {installIndexedDbEngine} from "../../testing/soukai.ts";
import {IndexedDbLocalDataStore} from "./IndexedDbLocalDataStore.ts";
import {IndexedDbAppStateStore} from "./IndexedDbAppStateStore.ts";
import {PodContainerRegistry} from "../solid/PodContainerRegistry.ts";
import {SoukaiCellar} from "../soukai/model/SoukaiCellar.ts";

const BASE = "https://alice.pod/private/kellermeister/v1/";
const WEBID_HISTORY_KEY = "kellermeister_webid_history";
const HISTORY = JSON.stringify(["https://alice.pod/profile#me", "https://bob.pod/profile#me"]);

function stubLocalStorage(seed: Record<string, string>): void {
    const store = new Map<string, string>(Object.entries(seed));
    Object.defineProperty(globalThis, "localStorage", {
        value: {
            getItem: (k: string) => store.get(k) ?? null,
            setItem: (k: string, v: string) => { store.set(k, v); },
            removeItem: (k: string) => { store.delete(k); },
        } as unknown as Storage,
        configurable: true,
    });
}

let dbCounter = 0;
let registry: PodContainerRegistry;
let appState: IndexedDbAppStateStore;
let wipe: IndexedDbLocalDataStore;

beforeEach(async () => {
    stubLocalStorage({[WEBID_HISTORY_KEY]: HISTORY});
    // A unique namespace per test => its own IndexedDB database (soukai-bis names
    // the database after the global namespace, not a constructor argument).
    installIndexedDbEngine(`wipe-${dbCounter++}`);
    registry = new PodContainerRegistry();
    registry.set(BASE);
    appState = new IndexedDbAppStateStore();
    wipe = new IndexedDbLocalDataStore(registry);
});

afterEach(async () => {
    const engine = getEngine();
    if (engine instanceof IndexedDBEngine) {
        await engine.close();
    }
});

describe("IndexedDbLocalDataStore", () => {

    it("deletes the domain data, the app state and the container base, keeping the WebID list", async () => {
        await new SoukaiCellar({url: `${BASE}cellars/altglass#it`, name: "Altglass"}).save();
        await appState.setWebId("https://alice.pod/profile#me");
        await appState.setLastSyncedAt(new Date("2026-08-20T10:00:00.000Z"));
        await appState.setSyncPending(true);
        expect(await SoukaiCellar.all({from: `${BASE}cellars/`})).toHaveLength(1);

        await wipe.wipe();

        expect(await SoukaiCellar.all({from: `${BASE}cellars/`})).toEqual([]);
        expect(await new IndexedDbAppStateStore().getWebId()).toBeNull();
        expect(await new IndexedDbAppStateStore().getLastSyncedAt()).toBeNull();
        expect(await new IndexedDbAppStateStore().isSyncPending()).toBe(false);
        // The container base is unresolved again — in memory and in localStorage.
        expect(registry.get()).toBeNull();
        expect(registry.container("cellars")).toBeNull();
        expect(new PodContainerRegistry().get()).toBeNull();
        // The login convenience list is untouched.
        expect(localStorage.getItem(WEBID_HISTORY_KEY)).toBe(HISTORY);
    });

    it("is idempotent: wiping already-absent state succeeds", async () => {
        await wipe.wipe();
        await expect(wipe.wipe()).resolves.toBeUndefined();

        expect(await new IndexedDbAppStateStore().getWebId()).toBeNull();
        expect(localStorage.getItem(WEBID_HISTORY_KEY)).toBe(HISTORY);
    });

    it("leaves the store usable afterwards, so a fresh identity can write", async () => {
        await new SoukaiCellar({url: `${BASE}cellars/old#it`, name: "Alt"}).save();

        await wipe.wipe();

        await new SoukaiCellar({url: `${BASE}cellars/new#it`, name: "Neu"}).save();
        const cellars = await SoukaiCellar.all({from: `${BASE}cellars/`});
        expect(cellars.map((c) => c.name)).toEqual(["Neu"]);
    });
});
