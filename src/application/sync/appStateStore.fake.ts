import type {AppStateStore} from "../ports/AppStateStore.ts";

export interface AppStateStoreSeed {
    webId?: string | null;
    lastSyncedAt?: Date | null;
    syncPending?: boolean;
    confirmedIdentitySwitch?: string | null;
}

/**
 * In-memory {@link AppStateStore} for tests, exposing the stored values for
 * assertions. Shared by the sync test suites.
 */
export function fakeAppState(seed?: AppStateStoreSeed) {
    let webId: string | null = seed?.webId ?? null;
    let lastSyncedAt: Date | null = seed?.lastSyncedAt ?? null;
    let syncPending: boolean = seed?.syncPending ?? false;
    let confirmedIdentitySwitch: string | null = seed?.confirmedIdentitySwitch ?? null;
    const store: AppStateStore = {
        getWebId: async () => webId,
        setWebId: async (v) => { webId = v; },
        getLastSyncedAt: async () => lastSyncedAt,
        setLastSyncedAt: async (d) => { lastSyncedAt = d; },
        isSyncPending: async () => syncPending,
        setSyncPending: async (pending) => { syncPending = pending; },
        getConfirmedIdentitySwitch: async () => confirmedIdentitySwitch,
        setConfirmedIdentitySwitch: async (webId) => { confirmedIdentitySwitch = webId; },
    };
    return {
        store,
        getWebId: () => webId,
        getLastSyncedAt: () => lastSyncedAt,
        isSyncPending: () => syncPending,
        getConfirmedIdentitySwitch: () => confirmedIdentitySwitch,
    };
}
