/**
 * Resource identity helpers supporting create-before-login (local-first).
 *
 * Every syncable resource is born with a PROVISIONAL, Pod-independent id under
 * the local scheme `local://<collection>/<slug>#it`. On the first sync after
 * login it is re-homed to a real Pod URL derived deterministically from the
 * SAME slug (`<collectionContainer><slug>#it`). Deterministic derivation makes
 * re-homing idempotent: re-running after a crash computes the identical Pod URL,
 * so no duplicates.
 *
 * Ordinary resources use a generated uuid as their slug. The two well-known
 * cellars use fixed slugs (`altglass`, `cellarwork`) so they resolve to a stable
 * Pod URL on every device.
 */

export type Collection = "cellars" | "bottles" | "products" | "orders";

export const LOCAL_BASE = "local://";

/** Fixed slugs for the two well-known cellars. */
export const WELL_KNOWN_CELLAR = {
    altglass: "altglass",
    cellarwork: "cellarwork",
} as const;

/** Mint a provisional local URL for a new resource in the given collection. */
export function mintProvisional(collection: Collection, slug: string = crypto.randomUUID()): string {
    return `${LOCAL_BASE}${collection}/${slug}#it`;
}

/** The provisional URL for a well-known cellar. */
export function wellKnownCellarUrl(slug: keyof typeof WELL_KNOWN_CELLAR): string {
    return mintProvisional("cellars", WELL_KNOWN_CELLAR[slug]);
}

/** Whether a URL is a provisional local-scheme identity (not yet on the Pod). */
export function isProvisional(url: string): boolean {
    return url.startsWith(LOCAL_BASE);
}

/** Whether a URL is a real (syncable) Pod resource URL. */
export function isPodUrl(url: string): boolean {
    return url.startsWith("http://") || url.startsWith("https://");
}

/** Extract the collection segment from a provisional URL (null if not provisional). */
export function collectionOf(url: string): Collection | null {
    if (!isProvisional(url)) {
        return null;
    }
    const rest = url.substring(LOCAL_BASE.length); // "<collection>/<slug>#it"
    const collection = rest.substring(0, rest.indexOf("/"));
    return (collection || null) as Collection | null;
}

/** Extract the slug from either a provisional or a Pod resource URL. */
export function slugOf(url: string): string {
    const withoutHash = url.split("#")[0];
    const withoutTrailingSlash = withoutHash.endsWith("/") ? withoutHash.slice(0, -1) : withoutHash;
    return withoutTrailingSlash.substring(withoutTrailingSlash.lastIndexOf("/") + 1);
}

/**
 * Deterministically derive the Pod URL for a resource from its slug.
 * `collectionContainer` is the concrete Pod container for the resource's
 * collection, e.g. `https://alice.pod/kellermeister/bottles/`.
 */
export function podUrl(collectionContainer: string, resourceUrl: string): string {
    const base = collectionContainer.endsWith("/") ? collectionContainer : `${collectionContainer}/`;
    return `${base}${slugOf(resourceUrl)}#it`;
}

/**
 * Deterministically re-home a URL to the Pod: strip the `local://` scheme and
 * prepend the Pod base. Because the local path already encodes
 * `<collection>/<slug>` (and any embedded `#fragment`), this maps every
 * provisional URL — resources AND their cross-references — uniformly and
 * idempotently. Non-provisional (already-Pod) URLs pass through unchanged.
 *
 * e.g. `local://bottles/<uuid>#it`      → `<base>bottles/<uuid>#it`
 *      `local://cellars/altglass#it`    → `<base>cellars/altglass#it`
 *      `local://orders/<uuid>#item-0`   → `<base>orders/<uuid>#item-0`
 */
export function rehomeUrl(podBase: string, url: string): string {
    if (!isProvisional(url)) {
        return url;
    }
    const base = podBase.endsWith("/") ? podBase : `${podBase}/`;
    return `${base}${url.substring(LOCAL_BASE.length)}`;
}
