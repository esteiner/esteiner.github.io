import {createContainerAt, getSolidDataset} from "@inrupt/solid-client";
import type {Collection} from "../shared/resource-identity.ts";

const COLLECTIONS: Collection[] = ["cellars", "bottles", "products", "orders"];

/**
 * Resolve (and provision if missing) the Kellermeister container base under the
 * user's storage, plus its per-collection subcontainers. Returns the base URL
 * (e.g. `https://alice.pod/kellermeister/`).
 */
export async function resolveKellermeisterContainer(
    storageRoot: string,
    authenticatedFetch: typeof fetch,
): Promise<string> {
    const base = `${ensureTrailingSlash(storageRoot)}kellermeister/`;
    await ensureContainer(base, authenticatedFetch);
    for (const collection of COLLECTIONS) {
        await ensureContainer(`${base}${collection}/`, authenticatedFetch);
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
