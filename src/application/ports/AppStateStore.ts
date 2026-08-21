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

    /**
     * The WebID the user confirmed switching to, if any. Recorded before the
     * login flow navigates away so the confirmation is not asked for a second
     * time when the session comes back; scoped to that one WebID, so an identity
     * provider authenticating someone else is still confirmed separately.
     */
    getConfirmedIdentitySwitch(): Promise<string | null>;
    setConfirmedIdentitySwitch(webId: string | null): Promise<void>;
}
