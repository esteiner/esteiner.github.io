/**
 * A cache of read models that must be dropped when the underlying data changed
 * underneath it — as a sync does, since it writes records straight into the
 * local store (re-homed URLs, records pulled from the Pod) without going
 * through the use cases that would otherwise invalidate the cache.
 */
export interface ReadModelCache {
    invalidate(): void;
}
