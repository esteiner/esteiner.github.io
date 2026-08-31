import type {Model} from "soukai-bis";
import type {Collection} from "../shared/resource-identity.ts";
import {LOCAL_BASE} from "../shared/resource-identity.ts";
import {withLocalEngine} from "./engineScope.ts";

/** The local-scheme container for a collection, e.g. `local://bottles/`. */
export function localContainer(collection: Collection): string {
    return `${LOCAL_BASE}${collection}/`;
}

interface QueryableModel<T> {
    all(options?: {from?: string}): Promise<T[]>;
}

/**
 * Read all live resources of a collection from IndexedDB: the union of the
 * local scheme (`local://<collection>/`) and, if the Pod base is known, the
 * re-homed Pod subcontainer, de-duplicated by URL.
 *
 * Soft-deleted (tombstoned) records are excluded automatically — soukai-bis
 * swaps a tombstoned document's type, so `all()` never returns it.
 *
 * Runs inside the engine gate, so it is never routed to the Pod engine while the
 * sync layer holds it.
 */
export async function fetchLive<T extends Model>(
    ModelClass: QueryableModel<T>,
    collection: Collection,
    podBase: string | null,
): Promise<T[]> {
    const byUrl = await withLocalEngine(async () => {
        const found = new Map<string, T>();
        for (const model of await ModelClass.all({from: localContainer(collection)})) {
            found.set(model.url as string, model);
        }
        if (podBase) {
            for (const model of await ModelClass.all({from: `${podBase}${collection}/`})) {
                found.set(model.url as string, model);
            }
        }
        return found;
    });
    return [...byUrl.values()];
}
