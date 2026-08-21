## Why

The app currently stores its Pod data directly under `{storageRoot}kellermeister/`. It should live under `{storageRoot}private/kellermeister/v1/` — placing it in the Pod's `private/` space and versioning the container (`v1`) so a future data-model change can move to `v2` without clobbering existing data. The container base was already edited to the new path, but the derived inbox path, doc comments, and tests still assume the old `/kellermeister/` segment, so the change is currently inconsistent (the inbox derivation is broken).

## What Changes

- The Kellermeister Pod container base SHALL be `{storageRoot}private/kellermeister/v1/` (with its per-collection subcontainers `cellars/`, `bottles/`, `products/`, `orders/`), instead of `{storageRoot}kellermeister/`.
- Fix the inbox storage-root derivation so it strips the full `private/kellermeister/v1/` suffix from the base; the inbox itself stays at its existing location `{storageRoot}inbox/kellermeister/` (unchanged).
- Update stale doc comments and tests that hardcode the old `/kellermeister/` base.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `pod-synchronization`: Specifies the Pod container location — the app's data lives under `{storageRoot}private/kellermeister/v1/`.
- `inbox-order-ingestion`: The inbox path is still derived from the resolved container base, but the derivation now accounts for the new `private/kellermeister/v1/` base (the inbox location `{storageRoot}inbox/kellermeister/` is unchanged).

## Impact

- `src/infrastructure/solid/podContainerResolution.ts` — base is `{storageRoot}private/kellermeister/v1/` (already edited); update the doc comment example.
- `src/infrastructure/solid/PodContainerRegistry.ts` — `inboxContainer()` must derive the storage root by stripping `private/kellermeister/v1/` (currently strips `kellermeister/`, which no longer matches); update the class/inbox doc comments.
- `src/infrastructure/solid/podContainerResolution.test.ts` — update expected base and subcontainer URL to the new path.
- `CLAUDE.md` — update the `{storageUrl}kellermeister/` reference.
- **Migration:** no automatic migration of existing Pod data. Local data (IndexedDB) is unaffected and re-homes to the new base on the next sync; any data previously written to the old `{storageRoot}kellermeister/` on the Pod is not moved and would be orphaned. Acceptable for the current stage; noted in design.
