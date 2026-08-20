import {NotAuthenticatedError} from "../../application/errors.ts";

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
