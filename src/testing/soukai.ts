/**
 * Test isolation for soukai-bis.
 *
 * Unlike soukai-solid's `IndexedDBEngine`, the soukai-bis one ignores its
 * constructor argument and keys off the global namespace, so the old pattern of
 * naming a separate database per test (or per local/remote role) no longer
 * isolates. Instead:
 *
 *  - use a fresh `InMemoryEngine()` per test / per role — each holds its own
 *    document store and implements the same contracts (`ManagesDocuments`, …) as
 *    the IndexedDB engine, including what soukai-bis `Sync` needs;
 *  - only tests that specifically exercise IndexedDB use `installIndexedDbEngine`
 *    with a unique namespace (its own database), against `fake-indexeddb`.
 *
 * All helpers boot the models (and install the engine context manager) via the
 * production `bootSoukaiModels`, so tests exercise the real boot path.
 */
import "fake-indexeddb/auto";
import {IndexedDBEngine, InMemoryEngine, setEngine, setNamespace} from "soukai-bis";
import {bootSoukaiModels} from "../infrastructure/soukai/bootModels.ts";

export {bootSoukaiModels};

/** Fresh isolated in-memory engine, installed as the global (local) engine. */
export function installMemoryEngine(): InMemoryEngine {
    bootSoukaiModels();
    const engine = new InMemoryEngine();
    setEngine(engine);
    return engine;
}

/** Fresh isolated in-memory engine, NOT installed — for remote/inbox simulation. */
export function createMemoryEngine(): InMemoryEngine {
    return new InMemoryEngine();
}

/**
 * Real IndexedDB engine under a unique namespace (so each test gets its own
 * database). Only for tests that specifically exercise IndexedDB persistence.
 */
export function installIndexedDbEngine(namespace: string): IndexedDBEngine {
    bootSoukaiModels();
    setNamespace(namespace);
    const engine = new IndexedDBEngine();
    setEngine(engine);
    return engine;
}
