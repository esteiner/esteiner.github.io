/**
 * Local, device-scoped app metadata that is NOT synced to the Pod: the WebID
 * used to authenticate, the date of the last successful synchronization, and
 * whether a sync is still owed to the user (see PendingSync). Persisted so all
 * of it survives a reload — including the navigation away from the app that the
 * OIDC login flow performs — and is readable offline / before a session is
 * restored. The concrete implementation lives in infrastructure.
 */
export interface AppStateStore {
    getWebId(): Promise<string | null>;
    setWebId(webId: string): Promise<void>;

    getLastSyncedAt(): Promise<Date | null>;
    setLastSyncedAt(date: Date): Promise<void>;

    isSyncPending(): Promise<boolean>;
    setSyncPending(pending: boolean): Promise<void>;
}
