/**
 * Destructive access to everything this device stores locally for one identity:
 * the domain data, the session metadata, and the resolved Pod container base.
 *
 * Exists so the application layer can own the DECISION to wipe (and its
 * ordering) while the browser-storage details stay in infrastructure.
 */
export interface LocalDataStore {

    /**
     * Delete all locally stored data belonging to the current identity.
     *
     * MUST be idempotent: wiping already-absent or partly-written state
     * succeeds. MUST NOT remove device-level state that belongs to no identity
     * (notably the list of WebIDs offered for login).
     */
    wipe(): Promise<void>;
}
