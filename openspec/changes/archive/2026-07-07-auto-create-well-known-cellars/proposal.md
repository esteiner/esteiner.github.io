## Why

The app relies on two special cellars — `cellarwork` (the "Eingang" / intake cellar) and `altglass` (the returned-glass cellar) — but today they only spring into existence *lazily*, when some code path happens to call `fetchCellarForCellarwork`/`fetchCellarForAltglass` or looks them up by id. Until that first touch, the well-known cellars are absent from the cellar list and from any flow that enumerates cellars, which is surprising and order-dependent. They should always exist, deterministically, from the moment the app is usable.

## What Changes

- Guarantee that the two well-known cellars (`cellarwork`, `altglass`) with their fixed slugs are **created automatically** and are always present, rather than materialized lazily on first access.
- Ensure them **at app startup** when the local (IndexedDB) cellar repository initializes, so — consistent with the local-first design — they exist before any login and are picked up by re-home/sync like any other locally-created resource.
- **Re-verify** them during `resolveKellermeisterContainer` (post-login container provisioning): after the Pod subfolders are ensured, confirm the two well-known cellars exist and create any that are missing, as a safety net for pre-existing local stores.
- Make well-known-cellar creation **idempotent** ("ensure" semantics): running it repeatedly — at startup, after a crash, or again at container resolution — never produces duplicates and never overwrites an existing cellar's data.

## Capabilities

### New Capabilities
- `well-known-cellars`: The lifecycle guarantees for the two fixed, system-provided cellars — their stable identities (fixed `cellarwork`/`altglass` slugs), when they are created (startup + container resolution), and their idempotent "ensure" semantics.

### Modified Capabilities
<!-- No existing specs in openspec/specs/; nothing to modify. -->

## Impact

- `src/infrastructure/shared/resource-identity.ts` — existing `WELL_KNOWN_CELLAR` fixed slugs (already present; no change to the identity scheme).
- `src/domain/Cellar/CellarRepository.ts` — add idempotent ensure operation(s) for the well-known cellars.
- `src/infrastructure/soukai/SoukaiCellarRepository.ts` — implement idempotent ensure; invoke at repository initialization (startup).
- `src/infrastructure/solid/podContainerResolution.ts` — after provisioning subfolders, re-verify the well-known cellars (via an injected ensure callback / repository), keeping the Solid layer decoupled from Soukai.
- `src/infrastructure/web/pages/landing-page.ts` and/or `src/infrastructure/cdi/CDI.ts` — wire the ensure step into container resolution.
- No breaking changes to persisted data; existing lazily-created well-known cellars continue to resolve to the same fixed slug URLs.
