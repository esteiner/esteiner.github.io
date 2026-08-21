import {describe, it, expect, afterEach} from "vitest";
import {PodContainerRegistry} from "./PodContainerRegistry.ts";
import {POD_CONTAINER_PATH} from "./podContainerPath.ts";

const STORAGE_KEY = "km.podContainerBase";

/** Minimal localStorage for the node test environment (the registry guards for its absence). */
function stubLocalStorage(seed?: Record<string, string>): Map<string, string> {
    const store = new Map<string, string>(Object.entries(seed ?? {}));
    const fake = {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => { store.set(key, value); },
        removeItem: (key: string) => { store.delete(key); },
    } as unknown as Storage;
    Object.defineProperty(globalThis, "localStorage", {value: fake, configurable: true});
    return store;
}

afterEach(() => {
    Reflect.deleteProperty(globalThis, "localStorage");
});

describe("PodContainerRegistry", () => {
    it("derives per-collection and inbox containers from the private/kellermeister/v1 base", () => {
        const reg = new PodContainerRegistry();
        reg.set("https://alice.pod/private/kellermeister/v1/");

        expect(reg.get()).toBe("https://alice.pod/private/kellermeister/v1/");
        expect(reg.container("cellars")).toBe("https://alice.pod/private/kellermeister/v1/cellars/");
        // The inbox stays at the storage-root level, with the full
        // private/kellermeister/v1/ segment stripped to recover the root.
        expect(reg.inboxContainer()).toBe("https://alice.pod/inbox/kellermeister/");
    });

    it("returns null containers before the base is resolved", () => {
        const reg = new PodContainerRegistry();
        expect(reg.get()).toBeNull();
        expect(reg.container("cellars")).toBeNull();
        expect(reg.inboxContainer()).toBeNull();
    });

    it("restores a persisted base of the current container version", () => {
        stubLocalStorage({[STORAGE_KEY]: `https://alice.pod/${POD_CONTAINER_PATH}`});

        expect(new PodContainerRegistry().get()).toBe(`https://alice.pod/${POD_CONTAINER_PATH}`);
    });

    it("discards a persisted base from an earlier container layout", () => {
        // A device that logged in before the move to private/kellermeister/v1/.
        stubLocalStorage({[STORAGE_KEY]: "https://alice.pod/kellermeister/"});

        const reg = new PodContainerRegistry();

        // Using it would sync into the old container and derive a bogus inbox.
        expect(reg.get()).toBeNull();
        expect(reg.container("cellars")).toBeNull();
        expect(reg.inboxContainer()).toBeNull();
    });

    it("persists a newly resolved base for the next start", () => {
        stubLocalStorage();

        new PodContainerRegistry().set(`https://alice.pod/${POD_CONTAINER_PATH}`);

        expect(new PodContainerRegistry().inboxContainer()).toBe("https://alice.pod/inbox/kellermeister/");
    });
});
