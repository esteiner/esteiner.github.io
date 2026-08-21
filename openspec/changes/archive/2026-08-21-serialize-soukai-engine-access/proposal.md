## Why

Soukai's engine is module-global state, and `withEngine()` swaps it for the duration of one operation, restoring it when that operation's promise settles. Any *other* async operation whose `await` resumes inside that window therefore runs against the wrong engine. Kellermeister depends on exactly this mechanism: the global engine is `IndexedDBEngine` and the synchronization layer temporarily installs a `SolidEngine`.

The consequence was observable in the browser: when the startup bootstrap (`ensureWellKnownCellars`) overlapped a sync, a local read was sent to the Pod and failed with `Request failed trying to fetch local://cellars/` — the Inrupt DPoP header builder cannot construct a URL from the `local://` scheme. A worse variant is latent: overlapping windows each restore the engine they captured on entry, so an inner window outliving an outer one leaves the `SolidEngine` installed permanently, breaking every subsequent local operation.

The existing `local-persistence` requirement already says the `SolidEngine` is used "only within the synchronization layer via a scoped `withEngine`" — the scoping was there, but it is not concurrency-safe, so the guarantee did not hold in practice.

## What Changes

- All Soukai engine access SHALL be serialized: at most one engine-scoped operation runs at a time, so no engine swap window can capture unrelated work.
- A local read or write SHALL never be routed to a Pod engine, and a Pod read or write SHALL never be routed to the local engine, regardless of what runs concurrently.
- An engine swap SHALL always be undone, so a failed or overlapping Pod operation cannot leave the `SolidEngine` installed as the global engine.
- Every existing engine-touching call site is routed through the gate: the repositories (reads, writes, deletes, relation loading), the inbox read, and the synchronization sweep and re-home.

## Capabilities

### New Capabilities
<!-- None. This constrains how the existing local-persistence and pod-synchronization capabilities access storage. -->

### Modified Capabilities
- `local-persistence`: *Local-only repositories* is strengthened — scoping the `SolidEngine` to the sync layer is not sufficient; engine access must be serialized so a local operation is never routed to the Pod, and a swap is always undone.

## Impact

- `src/infrastructure/soukai/engineScope.ts` (new) — `withLocalEngine(operation)` and `withRemoteEngine(engine, operation)` serialize onto one promise chain; a failed operation does not break the chain for the ones queued behind it. Deliberately non-reentrant, so the scopes stay at the leaves, directly around the Soukai calls.
- `src/infrastructure/soukai/localFirstQuery.ts` — `fetchLive` runs inside the gate, which covers every repository read.
- `src/infrastructure/soukai/SoukaiCellarRepository.ts`, `SoukaiBottleRepository.ts`, `SoukaiProductRepository.ts`, `SoukaiOrderRepository.ts` — saves, deletes, `find`, and relation loading gated; the inbox read uses `withRemoteEngine` instead of a bare `withEngine`.
- `src/infrastructure/solid/SolidSyncService.ts` — re-home runs as one local scope; the sweep is gated per block (local read, remote read, `synchronize` + local save, remote save, both create paths).
- No data-model, Pod-layout, or API change: this only constrains *which* engine a given operation reaches.
- Trade-off: a local read issued during a sync now queues behind that sync's current step instead of failing. See design Risks.
