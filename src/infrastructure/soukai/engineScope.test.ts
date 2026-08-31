/**
 * Regression tests for the engine gate: local reads must never be routed to the
 * remote (Pod) engine, no matter what the sync layer is doing concurrently.
 */
import {describe, it, expect, beforeEach} from "vitest";
import {InMemoryEngine, runWithEngine} from "soukai-bis";

import {installMemoryEngine} from "../../testing/soukai.ts";
import {SoukaiCellar} from "./model/SoukaiCellar.ts";
import {withLocalEngine, withRemoteEngine} from "./engineScope.ts";

const LOCAL = "local://cellars/";
const POD = "https://alice.pod/private/kellermeister/v1/cellars/";

/**
 * A stub Pod engine: records the containers it is asked to read, and can be held
 * open on a gate. Extends InMemoryEngine so it satisfies the full engine
 * contract; only the container read is instrumented.
 */
class RecordingEngine extends InMemoryEngine {

    readonly readCollections: string[] = [];

    constructor(private readonly gate: Promise<void>) {
        super();
    }

    async readDocuments(
        options: {urls: string[]} | {containerUrl: string; deep?: boolean; depth?: number},
    ): Promise<Record<string, Awaited<ReturnType<InMemoryEngine["readDocument"]>>>> {
        if ("containerUrl" in options) {
            this.readCollections.push(options.containerUrl);
        }
        await this.gate;
        return super.readDocuments(options);
    }
}

let openGate: () => void;
let remote: RecordingEngine;

beforeEach(() => {
    installMemoryEngine();
    remote = new RecordingEngine(new Promise<void>((resolve) => (openGate = resolve)));
});

describe("engine gate", () => {

    it("keeps a concurrent local read off the remote engine", async () => {
        const remoteRead = withRemoteEngine(remote, () => SoukaiCellar.all({from: POD}));
        const localRead = withLocalEngine(() => SoukaiCellar.all({from: LOCAL}));

        openGate();
        await expect(Promise.all([remoteRead, localRead])).resolves.toEqual([[], []]);

        expect(remote.readCollections).toEqual([POD]);
    });

    it("demonstrates the misrouting an ungated runWithEngine window causes", async () => {
        const remoteRead = runWithEngine(remote, () => SoukaiCellar.all({from: POD}));
        const ungatedLocalRead = SoukaiCellar.all({from: LOCAL});

        openGate();
        await Promise.allSettled([remoteRead, ungatedLocalRead]);

        expect(remote.readCollections).toContain(LOCAL);
    });

    it("does not wedge the gate when an operation fails", async () => {
        await expect(withLocalEngine(() => Promise.reject(new Error("boom")))).rejects.toThrow("boom");

        await expect(withLocalEngine(() => SoukaiCellar.all({from: LOCAL}))).resolves.toEqual([]);
    });
});
