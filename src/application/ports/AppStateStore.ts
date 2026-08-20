/**
 * Local, device-scoped app metadata that is NOT synced to the Pod: the WebID
 * used to authenticate and the date of the last successful synchronization.
 * Persisted so both survive a reload and are readable offline / before a
 * session is restored. The concrete implementation lives in infrastructure.
 */
export interface AppStateStore {
    getWebId(): Promise<string | null>;
    setWebId(webId: string): Promise<void>;

    getLastSyncedAt(): Promise<Date | null>;
    setLastSyncedAt(date: Date): Promise<void>;
}
