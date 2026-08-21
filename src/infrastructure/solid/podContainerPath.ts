/**
 * The Kellermeister container path under the user's Pod storage root.
 *
 * `private/` scopes the data to the Pod's private space; `v1/` versions the
 * container, so a future incompatible data-model change can target `v2/`
 * without disturbing existing `v1/` data.
 *
 * Single source of truth: the resolution provisions this path, and the registry
 * strips it again to recover the storage root (for the inbox) and to recognise a
 * persisted base as belonging to the current container version.
 */
export const POD_CONTAINER_PATH = "private/kellermeister/v1/";
