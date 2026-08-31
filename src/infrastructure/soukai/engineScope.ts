import {runWithEngine, type Engine} from "soukai-bis";

/**
 * Serializes every access to the Soukai engine.
 *
 * Soukai's engine is module-global state, and `withEngine()` swaps it for the
 * duration of one operation, restoring it when that operation's promise settles.
 * Any OTHER async operation whose await resumes inside that window therefore
 * runs against the wrong engine: a local read issued while the sync layer holds
 * the SolidEngine is sent to the Pod as `local://cellars/` (which fails while
 * constructing the DPoP header, because `local://` has no valid base URL).
 * Overlapping windows are worse still — each `withEngine()` restores the engine
 * it captured on entry, so an inner window that outlives an outer one leaves the
 * SolidEngine installed permanently, breaking all later local work.
 *
 * Routing local AND remote work through this gate makes the engine swap safe:
 * at most one engine-scoped operation is in flight at any time.
 *
 * The gate is NOT reentrant: never call these helpers from inside the callback
 * of another one — the inner call would wait for the outer to finish. Keep the
 * scopes at the leaves, directly around the Soukai calls.
 */

let tail: Promise<unknown> = Promise.resolve();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = tail.then(operation, operation);
    // A failed operation must not break the chain for the ones queued behind it.
    tail = result.catch(() => undefined);
    return result;
}

/** Run a local (IndexedDB) operation under the app's default engine. */
export function withLocalEngine<T>(operation: () => Promise<T>): Promise<T> {
    return serialize(operation);
}

/** Run an operation against a remote (Pod) engine, excluding all local work. */
export function withRemoteEngine<T>(engine: Engine, operation: () => Promise<T>): Promise<T> {
    return serialize(() => runWithEngine(engine, operation));
}
