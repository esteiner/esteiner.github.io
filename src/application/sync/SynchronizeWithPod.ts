import type {AuthService} from "../ports/AuthService.ts";
import type {SyncService, SyncOutcome} from "../ports/SyncService.ts";
import {NotAuthenticatedError} from "../errors.ts";

/**
 * Use case: reconcile local state with the Pod. Requires an authenticated
 * session; the actual reconciliation is delegated to the SyncService port.
 */
export class SynchronizeWithPod {
    constructor(
        private readonly auth: AuthService,
        private readonly sync: SyncService,
    ) {
    }

    async execute(): Promise<SyncOutcome> {
        if (!this.auth.isLoggedIn()) {
            throw new NotAuthenticatedError();
        }
        return this.sync.synchronize();
    }
}
