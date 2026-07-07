import type {Bottle} from "./Bottle.ts";

/**
 * Per-resource repository for bottles. Each bottle is its own local/Pod
 * resource; the repository is local-only (IndexedDB) — the Pod is reached
 * exclusively by the synchronization layer.
 */
export interface BottleRepository {

    /**
     * Fetch all (non-deleted) bottles with their products resolved.
     */
    fetchBottles(): Promise<Bottle[]>;

    /**
     * Persist a single bottle (create or update).
     */
    save(bottle: Bottle): Promise<Bottle>;

    /**
     * Persist several bottles.
     */
    saveAll(bottles: Bottle[]): Promise<void>;

    /**
     * Soft-delete a bottle so the deletion propagates on the next sync.
     */
    delete(bottle: Bottle): Promise<void>;
}
