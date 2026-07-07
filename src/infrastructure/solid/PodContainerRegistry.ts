import type {Collection} from "../shared/resource-identity.ts";

const STORAGE_KEY = "km.podContainerBase";

/**
 * Holds the resolved Pod container base (e.g. `https://alice.pod/kellermeister/`)
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
        this.base = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
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

    /** The Pod subcontainer for a collection, or null if the base is unknown. */
    container(collection: Collection): string | null {
        return this.base ? `${this.base}${collection}/` : null;
    }

    /**
     * The Pod inbox container for unprocessed orders (`{storageRoot}inbox/kellermeister/`),
     * a sibling of the Kellermeister base, or null if the base is unknown. The
     * storage root is the base with its trailing `kellermeister/` segment removed.
     */
    inboxContainer(): string | null {
        if (!this.base) {
            return null;
        }
        const storageRoot = this.base.replace(/kellermeister\/$/, "");
        return `${storageRoot}inbox/kellermeister/`;
    }
}
