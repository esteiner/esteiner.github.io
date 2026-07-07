import type {SolidModel} from "soukai-solid";
import type {Collection} from "../shared/resource-identity.ts";
import {LOCAL_BASE} from "../shared/resource-identity.ts";

/** The local-scheme container for a collection, e.g. `local://bottles/`. */
export function localContainer(collection: Collection): string {
    return `${LOCAL_BASE}${collection}/`;
}

interface QueryableModel<T> {
    from(container: string): {all(): Promise<T[]>};
}

/**
 * Read all live resources of a collection from IndexedDB: the union of the
 * local scheme (`local://<collection>/`) and, if the Pod base is known, the
 * re-homed Pod subcontainer. Soft-deleted records are filtered out and results
 * are de-duplicated by URL.
 */
export async function fetchLive<T extends SolidModel>(
    ModelClass: QueryableModel<T>,
    collection: Collection,
    podBase: string | null,
): Promise<T[]> {
    const byUrl = new Map<string, T>();
    for (const model of await ModelClass.from(localContainer(collection)).all()) {
        byUrl.set(model.url, model);
    }
    if (podBase) {
        for (const model of await ModelClass.from(`${podBase}${collection}/`).all()) {
            byUrl.set(model.url, model);
        }
    }
    return [...byUrl.values()].filter((model) => !model.isSoftDeleted());
}
