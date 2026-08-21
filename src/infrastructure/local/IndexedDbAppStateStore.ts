import type {AppStateStore} from "../../application/ports/AppStateStore.ts";

const DB_NAME = "kellermeister-appstate";
const STORE = "appState";
const KEY_WEBID = "webId";
const KEY_LAST_SYNCED_AT = "lastSyncedAt";
const KEY_SYNC_PENDING = "syncPending";

/**
 * IndexedDB-backed {@link AppStateStore}. Uses a dedicated database — separate
 * from soukai's `kellermeister` engine — so it never collides with soukai's
 * schema/versioning. A single object store holds the values keyed by name.
 *
 * Degrades gracefully when IndexedDB is unavailable (e.g. SSR / private mode):
 * reads resolve `null`, writes no-op — the app keeps working without
 * persistence (mirrors PodContainerRegistry's localStorage guard).
 */
export class IndexedDbAppStateStore implements AppStateStore {

    private available(): boolean {
        return typeof indexedDB !== "undefined";
    }

    private openDb(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    db.createObjectStore(STORE);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private async get(key: string): Promise<unknown> {
        if (!this.available()) {
            return null;
        }
        const db = await this.openDb();
        try {
            return await new Promise<unknown>((resolve, reject) => {
                const request = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
                request.onsuccess = () => resolve(request.result ?? null);
                request.onerror = () => reject(request.error);
            });
        } finally {
            db.close();
        }
    }

    private async put(key: string, value: unknown): Promise<void> {
        if (!this.available()) {
            return;
        }
        const db = await this.openDb();
        try {
            await new Promise<void>((resolve, reject) => {
                const tx = db.transaction(STORE, "readwrite");
                tx.objectStore(STORE).put(value, key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } finally {
            db.close();
        }
    }

    async getWebId(): Promise<string | null> {
        const value = await this.get(KEY_WEBID);
        return typeof value === "string" && value ? value : null;
    }

    async setWebId(webId: string): Promise<void> {
        await this.put(KEY_WEBID, webId);
    }

    async getLastSyncedAt(): Promise<Date | null> {
        const value = await this.get(KEY_LAST_SYNCED_AT);
        if (typeof value !== "string" || !value) {
            return null;
        }
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }

    async setLastSyncedAt(date: Date): Promise<void> {
        await this.put(KEY_LAST_SYNCED_AT, date.toISOString());
    }

    async isSyncPending(): Promise<boolean> {
        return await this.get(KEY_SYNC_PENDING) === true;
    }

    async setSyncPending(pending: boolean): Promise<void> {
        await this.put(KEY_SYNC_PENDING, pending);
    }
}
