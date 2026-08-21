import {getEngine, IndexedDBEngine} from "soukai";
import type {LocalDataStore} from "../../application/ports/LocalDataStore.ts";
import type {PodContainerRegistry} from "../solid/PodContainerRegistry.ts";
import {APP_STATE_DB_NAME} from "./IndexedDbAppStateStore.ts";

/**
 * Wipes this device's identity-scoped local state:
 *
 *  - the Soukai domain data (cellars, bottles, products, orders);
 *  - the app-state database (recorded WebID, last-sync date, pending-sync flag);
 *  - the resolved Pod container base, in localStorage AND in memory.
 *
 * The list of WebIDs offered for login is deliberately left alone: it is a
 * device-level convenience list the user typed themselves, not data belonging to
 * an identity, and clearing it would only make switching back harder.
 */
export class IndexedDbLocalDataStore implements LocalDataStore {

    constructor(private readonly containers: PodContainerRegistry) {
    }

    async wipe(): Promise<void> {
        await this.purgeDomainData();
        await deleteDatabase(APP_STATE_DB_NAME);
        this.containers.clear();
    }

    /**
     * Purge the Soukai database through the ENGINE rather than deleting it by
     * name: `indexedDB.deleteDatabase` blocks while connections are open, and
     * the global engine holds them. `purgeDatabase()` closes its own
     * connections first, so it must run on that same instance.
     */
    private async purgeDomainData(): Promise<void> {
        const engine = getEngine();
        if (engine instanceof IndexedDBEngine) {
            await engine.purgeDatabase();
        }
    }
}

/** Delete an IndexedDB database by name; a missing database is not an error. */
function deleteDatabase(name: string): Promise<void> {
    if (typeof indexedDB === "undefined") {
        return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onblocked = () => resolve(); // no open connection of ours; the delete completes once the page goes away
        request.onerror = () => reject(request.error);
    });
}
