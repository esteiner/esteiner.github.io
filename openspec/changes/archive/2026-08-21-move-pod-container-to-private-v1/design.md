## Context

`resolveKellermeisterContainer(storageRoot, fetch, ensureWellKnownCellars?)` (podContainerResolution.ts) provisions the container base and its per-collection subcontainers on login, then returns the base. `PodContainerRegistry` persists that base (localStorage) and derives per-collection containers and the inbox container from it; repositories and the sync layer query the base.

The base string was already changed in the working tree to `{storageRoot}private/kellermeister/v1/` (one uncommitted line vs HEAD's `{storageRoot}kellermeister/`), but three things still assume the old layout:

1. `PodContainerRegistry.inboxContainer()` derives the storage root with `this.base.replace(/kellermeister\/$/, "")`. The new base ends in `v1/`, so the regex no longer matches → it returns `{root}private/kellermeister/v1/inbox/kellermeister/` (wrong).
2. Doc comments (`e.g. https://alice.pod/kellermeister/`) in both files, and `CLAUDE.md`.
3. `podContainerResolution.test.ts` asserts the base is `https://alice.pod/kellermeister/` (now failing).

## Goals / Non-Goals

**Goals:**
- Container base is `{storageRoot}private/kellermeister/v1/` end-to-end, with the inbox derivation fixed.
- Docs and tests reflect the new base.

**Non-Goals:**
- Moving the inbox — it stays at `{storageRoot}inbox/kellermeister/`.
- Migrating existing Pod data from the old base.
- Changing the local (IndexedDB) `local://` scheme or re-home mechanics (only the Pod-side base string changes).

## Decisions

### Decision 1: Base = `{storageRoot}private/kellermeister/v1/`
Keep the working-tree base string. `private/` scopes the data to the Pod's private space; `v1/` versions the container so a future incompatible data-model change can target `v2/` without disturbing `v1/` data.

### Decision 2: Fix the inbox derivation; keep the inbox location unchanged
Derive the storage root by stripping the full `private/kellermeister/v1/` suffix from the base, then form the inbox as `{storageRoot}inbox/kellermeister/` exactly as before. Prefer a robust strip (e.g. `this.base.replace(/private\/kellermeister\/v1\/$/, "")`) over the old `kellermeister/$` regex.

- **Why keep the inbox at `{root}inbox/kellermeister/`?** The inbox is the public drop location senders write to; the request was only about the app's data container. Keeping it unchanged is the minimal, non-surprising choice. (If the inbox should also be versioned later, that's a separate change.)
- **Alternative considered:** move the inbox under `private/kellermeister/v1/` — rejected; not requested, and it would change the sender-facing contract.

### Decision 3: No automatic Pod data migration
Local data is the source of truth (local-first) and re-homes to the new base on the next sync. Data previously synced to `{storageRoot}kellermeister/` on the Pod is left in place (orphaned), not migrated. At this stage that is acceptable; a one-off migration could be added later if needed.

### Decision 4: Discard a persisted base from an earlier layout
`PodContainerRegistry` restores the base from `localStorage` on construction, so on a device that logged in before this change it would start up holding the OLD base — and be used before the landing page re-resolves it (which costs several network round-trips). That would sync data into the old container and derive a bogus inbox (`{root}kellermeister/inbox/kellermeister/`), i.e. exactly the failure Risk 2 describes, reached via stale state rather than a wrong regex.

The base is therefore validated on read: anything not ending in the current container path is discarded, leaving the app in its pre-login state until the base is resolved again. The path itself lives in one place (`podContainerPath.ts`) so provisioning, inbox derivation, and this check cannot drift — and a future `v2/` is a one-line change that automatically invalidates persisted `v1/` bases.

- **Alternative considered:** version the storage key (`km.podContainerBase.v1`) — equivalent effect, but it leaves a stale key behind per version and the check would still need the path constant.

## Risks / Trade-offs

- **[Orphaned data at the old Pod path]** → Documented; local data re-homes to the new base, so the app remains correct. Old Pod resources can be deleted manually if desired.
- **[Inbox derivation regex must match the new suffix exactly]** → Covered by fixing the strip to `private/kellermeister/v1/`; a wrong strip would point the inbox at a non-existent container. Verify the derived inbox URL.
- **[Stale persisted base on existing installs]** → Covered by Decision 4: a base from an earlier layout is discarded on read.

## Migration Plan

Code-only. On the next login/sync, `resolveKellermeisterContainer` provisions `{storageRoot}private/kellermeister/v1/` and re-home pushes local data there. Rollback = revert the base string (and the inbox strip); local data is untouched either way.

## Open Questions

None — base path and inbox handling are decided; migration is intentionally a no-op.
