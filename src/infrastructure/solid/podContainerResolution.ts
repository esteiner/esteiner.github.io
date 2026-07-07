import {createContainerAt, getSolidDataset} from "@inrupt/solid-client";
import type {Collection} from "../shared/resource-identity.ts";

const COLLECTIONS: Collection[] = ["cellars", "bottles", "products", "orders"];

/**
 * Resolve (and provision if missing) the Kellermeister container base under the
 * user's storage, plus its per-collection subcontainers. Returns the base URL
 * (e.g. `https://alice.pod/kellermeister/`).
 *
 * Once the subcontainers are provisioned, `ensureWellKnownCellars` (if given) is
 * invoked to re-verify that the two well-known cellars (cellarwork, altglass)
 * exist — a safety net for local stores predating automatic startup creation.
 * The callback keeps this Solid-layer function decoupled from the repository.
 */
export async function resolveKellermeisterContainer(
    storageRoot: string,
    authenticatedFetch: typeof fetch,
    ensureWellKnownCellars?: () => Promise<void>,
): Promise<string> {
    const base = `${ensureTrailingSlash(storageRoot)}kellermeister/`;
    await ensureContainer(base, authenticatedFetch);
    for (const collection of COLLECTIONS) {
        await ensureContainer(`${base}${collection}/`, authenticatedFetch);
    }
    if (ensureWellKnownCellars) {
        await ensureWellKnownCellars();
    }
    return base;
}

async function ensureContainer(url: string, authenticatedFetch: typeof fetch): Promise<void> {
    try {
        await getSolidDataset(url, {fetch: authenticatedFetch});
    } catch {
        await createContainerAt(url, {fetch: authenticatedFetch});
    }
}

function ensureTrailingSlash(url: string): string {
    return url.endsWith("/") ? url : `${url}/`;
}
