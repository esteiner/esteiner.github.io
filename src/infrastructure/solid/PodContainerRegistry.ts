import type {Collection} from "../shared/resource-identity.ts";
import {POD_CONTAINER_PATH} from "./podContainerPath.ts";

const STORAGE_KEY = "km.podContainerBase";

/**
 * Holds the resolved Pod container base (e.g. `https://alice.pod/private/kellermeister/v1/`)
 * once a session exists, and derives the per-collection subcontainers
 * (`cellars/`, `bottles/`, `products/`, `orders/`).
 *
 * The base is persisted so that a later offline session mints correct Pod URLs
 * during re-home. Repositories query the union of the local scheme and (if
 * known) the Pod subcontainer — both live in IndexedDB, since the global engine
 * is IndexedDB and re-home merely rewrites resource URLs in place.
 */
export class PodContainerRegistry {
    private base: string | null;

    constructor() {
        this.base = readPersistedBase();
    }

    get(): string | null {
        return this.base;
    }

    require(): string {
        if (!this.base) {
            throw new Error("Pod container base is not resolved yet.");
        }
        return this.base;
    }

    set(base: string): void {
        this.base = base.endsWith("/") ? base : `${base}/`;
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(STORAGE_KEY, this.base);
        }
    }

    /**
     * Forget the resolved base, in memory and in localStorage. Used when the
     * local data is wiped on a WebID switch: the cached field would otherwise
     * keep the previous identity's container live for the rest of the session.
     */
    clear(): void {
        this.base = null;
        if (typeof localStorage !== "undefined") {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    /** The Pod subcontainer for a collection, or null if the base is unknown. */
    container(collection: Collection): string | null {
        return this.base ? `${this.base}${collection}/` : null;
    }

    /**
     * The Pod inbox container for unprocessed orders (`{storageRoot}inbox/kellermeister/`),
     * or null if the base is unknown. The storage root is the base with its
     * trailing {@link POD_CONTAINER_PATH} segment removed.
     */
    inboxContainer(): string | null {
        if (!this.base) {
            return null;
        }
        const storageRoot = this.base.endsWith(POD_CONTAINER_PATH)
            ? this.base.slice(0, -POD_CONTAINER_PATH.length)
            : this.base;
        return `${storageRoot}inbox/kellermeister/`;
    }
}

/**
 * The persisted base, or null if there is none — or if it belongs to an earlier
 * container layout (e.g. `{storageRoot}kellermeister/`, before the move to
 * {@link POD_CONTAINER_PATH}). Such a base MUST NOT be used: it would make the
 * app sync into the old container and break the inbox derivation. Discarding it
 * leaves the app in its pre-login state until the base is resolved again.
 */
function readPersistedBase(): string | null {
    if (typeof localStorage === "undefined") {
        return null;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && stored.endsWith(POD_CONTAINER_PATH) ? stored : null;
}
