import type {AppStateStore} from "../ports/AppStateStore.ts";
import type {LocalDataStore} from "../ports/LocalDataStore.ts";

/** What the caller must do about a WebID that is about to be adopted. */
export type IdentityCheck =
    /** Same WebID as recorded, or none recorded yet — adopt it, change nothing. */
    | {kind: "proceed"}
    /** A different WebID — the local data of the previous identity must go first. */
    | {kind: "wipe-required"; previousWebId: string};

/**
 * Ties the local store to the WebID that owns it.
 *
 * Local data is the source of truth in this app and is re-homed to whichever Pod
 * the user is logged into, so adopting a session for a DIFFERENT WebID without
 * clearing the store first would show one identity's data to another and push it
 * into their Pod. This use case decides when that applies and performs the
 * switch in an order that is safe to interrupt.
 *
 * The user's confirmation is NOT handled here: callers ask first (the UI owns
 * that) and only then call `switchTo`.
 */
export class SwitchIdentity {

    constructor(
        private readonly appState: AppStateStore,
        private readonly localData: LocalDataStore,
    ) {
    }

    /**
     * Whether adopting `webId` requires wiping first. An absent record means
     * first use on this device, NOT a switch: the local data was created by this
     * same user before authenticating (the app is usable offline), so it must
     * survive and be syncable.
     */
    async check(webId: string): Promise<IdentityCheck> {
        const recorded = await this.appState.getWebId();
        if (!recorded || recorded === webId) {
            return {kind: "proceed"};
        }
        return {kind: "wipe-required", previousWebId: recorded};
    }

    /**
     * Adopt `webId` as this device's identity: for a different WebID, delete the
     * previous identity's local data and THEN record the new one. For the same
     * WebID (or a first use) only the record is written.
     *
     * The order matters and is deliberately not reversed: the wipe deletes the
     * store holding the record, so recording first would erase it again. If the
     * app dies between the two steps, no record remains and the next login
     * counts as first use — safe, because the data is already gone.
     *
     * Returns whether a wipe was performed, so the caller knows that in-memory
     * state from before it is now stale.
     */
    async switchTo(webId: string): Promise<boolean> {
        const check = await this.check(webId);
        const wiped = check.kind === "wipe-required";
        if (wiped) {
            await this.localData.wipe();
        }
        await this.appState.setWebId(webId);
        return wiped;
    }
}
