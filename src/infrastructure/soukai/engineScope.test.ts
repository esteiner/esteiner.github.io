/**
 * Regression tests for the engine gate: local reads must never be routed to the
 * remote (Pod) engine, no matter what the sync layer is doing concurrently.
 */
import "fake-indexeddb/auto";
import {describe, it, expect, beforeEach} from "vitest";
import {bootModels, IndexedDBEngine, setEngine, withEngine, type Engine, type EngineDocument, type EngineDocumentsCollection} from "soukai";
import {bootSolidModels} from "soukai-solid";

import {SoukaiCellar} from "./model/SoukaiCellar.ts";
import {withLocalEngine, withRemoteEngine} from "./engineScope.ts";

bootSolidModels();
bootModels({SoukaiCellar});

const LOCAL = "local://cellars/";
const POD = "https://alice.pod/private/kellermeister/v1/cellars/";

/** A stub Pod engine: records the containers it is asked to read, and can be held open. */
class RecordingEngine implements Engine {

    readonly readCollections: string[] = [];

    constructor(private readonly gate: Promise<void>) {
    }

    async create(): Promise<string> {
        return "";
    }

    async readOne(): Promise<EngineDocument> {
        return {};
    }

    async readMany(collection: string): Promise<EngineDocumentsCollection> {
        this.readCollections.push(collection);
        await this.gate;
        return {};
    }

    async update(): Promise<void> {
    }

    async delete(): Promise<void> {
    }
}

let dbCounter = 0;
let openGate: () => void;
let remote: RecordingEngine;

beforeEach(() => {
    setEngine(new IndexedDBEngine(`gate-${dbCounter++}`));
    remote = new RecordingEngine(new Promise<void>((resolve) => (openGate = resolve)));
});

describe("engine gate", () => {

    it("keeps a concurrent local read off the remote engine", async () => {
        const remoteRead = withRemoteEngine(remote, () => SoukaiCellar.from(POD).all());
        const localRead = withLocalEngine(() => SoukaiCellar.from(LOCAL).all());

        openGate();
        await expect(Promise.all([remoteRead, localRead])).resolves.toEqual([[], []]);

        expect(remote.readCollections).toEqual([POD]);
    });

    it("demonstrates the misrouting an ungated withEngine window causes", async () => {
        const remoteRead = withEngine(remote, () => SoukaiCellar.from(POD).all());
        const ungatedLocalRead = SoukaiCellar.from(LOCAL).all();

        openGate();
        await Promise.allSettled([remoteRead, ungatedLocalRead]);

        expect(remote.readCollections).toContain(LOCAL);
    });

    it("does not wedge the gate when an operation fails", async () => {
        await expect(withLocalEngine(() => Promise.reject(new Error("boom")))).rejects.toThrow("boom");

        await expect(withLocalEngine(() => SoukaiCellar.from(LOCAL).all())).resolves.toEqual([]);
    });
});
