Status: the implementation already exists in the working tree; this change specifies it. Items are checked where the code and tests are in place — see 4.3 for what is still unverified.

## 1. The gate

- [x] 1.1 Add `src/infrastructure/soukai/engineScope.ts` with `withLocalEngine(operation)` (default engine) and `withRemoteEngine(engine, operation)` (wraps `withEngine`), both chaining onto a single promise so at most one engine-scoped operation is in flight.
- [x] 1.2 Advance the chain through a swallowed rejection, so a failed operation reports to its own caller without blocking the operations queued behind it (design Decision 2).
- [x] 1.3 Document in the module header why the gate exists (the global engine swap, the misrouting and leaked-engine failure modes) and that it is NOT reentrant, so scopes must stay at the leaves directly around the Soukai calls (design Decision 3).

## 2. Route the local call sites

- [x] 2.1 `localFirstQuery.ts` — run `fetchLive`'s reads inside `withLocalEngine`, which covers every repository read through one place.
- [x] 2.2 `SoukaiCellarRepository` — gate `save` (create and well-known ensure) and `delete`.
- [x] 2.3 `SoukaiBottleRepository` — gate `save` and `delete`.
- [x] 2.4 `SoukaiProductRepository` — gate `save`, `fetchById` (`find` + `ratings` relation), and the `ratings` loading in `fetchAll`.
- [x] 2.5 `SoukaiOrderRepository` — gate `saveProcessedOrder`, `fetchOrderById`, and the relation loading in `fetchOrders` (seller, customer, contactPoint, positions, and each item's product).

## 3. Route the Pod call sites

- [x] 3.1 `SoukaiOrderRepository.fetchUnprocessedOrders` — replace the bare `withEngine` with `withRemoteEngine` for the inbox read and its relation loading.
- [x] 3.2 `SolidSyncService.rehome` — run the whole migration as one local scope (it is purely local work), keeping the loop body unchanged.
- [x] 3.3 `SolidSyncService.sweep` — gate per block rather than around the method (the gate is not reentrant): the local read plus its embedded-relation loading, the remote read plus its embedded-relation loading, `synchronize` + local save, the remote save, and both create paths.
- [x] 3.4 Remove the now-unused direct `withEngine` import from `SolidSyncService` and `SoukaiOrderRepository`, so the gate is the only route to an engine swap in those files.

## 4. Tests and verification

- [x] 4.1 `engineScope.test.ts`: with the gate, a local read concurrent with a held-open Pod read is served locally and no `local://…` container reaches the Pod engine; a failed operation does not wedge the chain. Plus a companion test asserting that a *bare* `withEngine` window DOES misroute a concurrent local read, so the reason the gate exists cannot be deleted silently.
- [x] 4.2 `local-first.test.ts`: acceptance test driving the real repositories and `SolidSyncService` against a Pod engine that fires a local read and holds its window open around it — asserts no non-Pod container is ever requested from the Pod engine. Verified to be a real guard: with the gate bypassed it fails with `expected [ 'local://cellars/' ] to deeply equal []`, matching the originally reported browser error.
- [ ] 4.3 Manual verification in the browser — NOT done: needs a live Solid Pod. To check: with a stored session, trigger a sync while the startup bootstrap is still running and confirm no `Request failed trying to fetch local://cellars/` appears in the console, and that local reads keep working after a sync fails mid-run.
- [x] 4.4 Typecheck (`tsc --noEmit`), full test suite, and production build pass.
