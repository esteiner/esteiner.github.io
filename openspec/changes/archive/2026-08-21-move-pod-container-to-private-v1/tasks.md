## 1. Container base

- [x] 1.1 `resolveKellermeisterContainer` (`src/infrastructure/solid/podContainerResolution.ts`) builds the base as `{storageRoot}private/kellermeister/v1/` and provisions it plus the per-collection subcontainers `cellars/`, `bottles/`, `products/`, `orders/`. (The base string itself was already edited in the working tree before this change; it now comes from the shared constant below.)
- [x] 1.2 Extract the path into a single source of truth: `POD_CONTAINER_PATH = "private/kellermeister/v1/"` in `src/infrastructure/solid/podContainerPath.ts`, used by the resolution, the inbox derivation and the persisted-base check, so the three cannot drift and a future `v2/` is a one-line change. Kept dependency-free on purpose — `PodContainerRegistry` must not transitively import `@inrupt/solid-client` (that import fails in the node test environment unless mocked).

## 2. Inbox derivation

- [x] 2.1 `PodContainerRegistry.inboxContainer()` recovers the storage root by stripping the full `POD_CONTAINER_PATH` suffix (the old `/kellermeister\/$/` regex no longer matched the versioned base), then forms the inbox as `{storageRoot}inbox/kellermeister/` — unchanged location, per design Decision 2. Implemented with `endsWith`/`slice` rather than a regex, so a base that does not match cannot silently yield a wrong URL.

## 3. Persisted base from an earlier layout (design Decision 4)

- [x] 3.1 `PodContainerRegistry` validates the base it restores from `localStorage`: anything not ending in `POD_CONTAINER_PATH` is discarded, so a device that logged in before this change starts in its pre-login state instead of syncing into `{storageRoot}kellermeister/` and deriving `{storageRoot}kellermeister/inbox/kellermeister/`. Found during verification: the base is restored on construction and used before the landing page re-resolves it (several network round-trips later), and the startup pending-sync path treats a restored base as resolved.

  No migration code, by design (Decision 3): local data is the source of truth and re-homes to the new base on the next sync; data previously synced to the old Pod container is left in place, orphaned.

## 4. Docs

- [x] 4.1 `podContainerResolution.ts` — doc comment example updated to `https://alice.pod/private/kellermeister/v1/`.
- [x] 4.2 `PodContainerRegistry.ts` — class doc example and `inboxContainer()` doc updated (the latter now refers to `POD_CONTAINER_PATH` instead of naming the path a second time).
- [x] 4.3 `CLAUDE.md` — data-layer section now says `{storageUrl}private/kellermeister/v1/`.
- [x] 4.4 `src/infrastructure/shared/resource-identity.ts` — `podUrl` doc example updated to `https://alice.pod/private/kellermeister/v1/bottles/` (missed by the original Impact list; found during verification).

## 5. Tests

- [x] 5.1 `podContainerResolution.test.ts` — expects the base `https://alice.pod/private/kellermeister/v1/` (with and without a trailing slash on the storage root) and asserts that all four subcontainers are created, matching the scenario.
- [x] 5.2 `PodContainerRegistry.test.ts` (new) — base, per-collection container and inbox derivation from a current-version base; all null before the base is resolved.
- [x] 5.3 `PodContainerRegistry.test.ts` — persisted-base behaviour via a `localStorage` stub (the vitest env is `node`): a current-version base is restored, an earlier-layout base is discarded, and a newly resolved base persists for the next start. Confirmed the discard test is a real guard: with the validation removed it fails with `expected 'https://alice.pod/kellermeister/' to be null`.
- [x] 5.4 Test fixtures that hardcoded the old base moved to the current layout: `local-first.test.ts` `POD_BASE`, `engineScope.test.ts` `POD`. (Cosmetic — the base is injected and opaque in both.)

## 6. Verification

- [x] 6.1 Typecheck (`tsc --noEmit`) passes; full suite passes (146 tests, 17 files); production build (`vite build`) succeeds.
- [x] 6.2 `openspec validate move-pod-container-to-private-v1` passes; `design.md` (Decision 4 + Risks) and `specs/pod-synchronization/spec.md` (requirement sentence + "A persisted base from an earlier container layout is ignored" scenario) were updated to match the implementation.
- [ ] 6.3 Manual verification against a live Pod — NOT done: needs Solid credentials not available in this environment. To check: after login, data is provisioned under `{storageRoot}private/kellermeister/v1/`; inbox ingestion still reads `{storageRoot}inbox/kellermeister/`; on a browser profile that used the old base, the first start discards it and re-resolves without touching `{storageRoot}kellermeister/`.
