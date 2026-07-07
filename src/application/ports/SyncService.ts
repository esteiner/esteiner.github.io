/**
 * The result of a single synchronization run.
 */
export interface SyncOutcome {
    reconciled: number;
}

/**
 * Application port: reconciles local (IndexedDB) state with the Solid Pod.
 * The concrete implementation lives in infrastructure and is the ONLY component
 * that reaches the Pod for domain data.
 */
export interface SyncService {
    synchronize(): Promise<SyncOutcome>;
}
