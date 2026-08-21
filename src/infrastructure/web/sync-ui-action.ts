import {NotAuthenticatedError} from "../../application/errors.ts";
import type {SyncState} from "../../application/sync/SyncCoordinator.ts";

/**
 * How the UI should react when a manual sync request fails. A missing session
 * means the user should be sent through the login flow; any other failure is a
 * generic hint. Kept framework-agnostic (no Lit/DOM) so it is unit-testable in
 * the node test environment, and shared by every manual-sync entry point.
 */
export type SyncFailureAction =
    | {kind: "login"}
    | {kind: "hint"; message: string};

export function syncFailureAction(error: unknown): SyncFailureAction {
    if (error instanceof NotAuthenticatedError) {
        return {kind: "login"};
    }
    return {kind: "hint", message: "Synchronisierung fehlgeschlagen."};
}

/**
 * Whether a manual sync that has returned should be remembered so it can be
 * completed later (see PendingSync). A run that captured a failure — typically
 * because the device is offline — is remembered, so coming back online finishes
 * what the user asked for. A successful run, or one that was coalesced into an
 * in-flight run, is not.
 */
export function shouldRememberSync(state: SyncState): boolean {
    return state === "error";
}
