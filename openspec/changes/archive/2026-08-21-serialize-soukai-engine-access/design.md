## Context

Soukai resolves the engine for a model operation from module-global state. `withEngine(engine, operation)` captures the current engine, installs the given one, runs the operation, and restores the captured engine when the returned promise settles (`soukai/dist/index-DeBGSgZ2.js`, the `K` function). There is no per-operation engine binding and no re-entrancy protection.

Kellermeister is local-first: `main.ts` installs an `IndexedDBEngine` as the global engine, and only two places install a `SolidEngine` — `SolidSyncService` (the sweep against the Pod) and `SoukaiOrderRepository.fetchUnprocessedOrders` (the Pod inbox). Both did so with a bare `withEngine`.

Two failure modes follow:

1. **Misrouting.** Any operation whose `await` resumes while a `SolidEngine` window is open uses that engine. Observed in the browser as `Request failed trying to fetch local://cellars/`, thrown while constructing the DPoP header (`local://` is not a valid URL base) — a local cellar read that arrived at the Pod.
2. **Leaked engine.** Two overlapping windows each restore *the engine they captured on entry*. If the inner window settles after the outer one, it restores the `SolidEngine`, which then stays installed as the global engine and breaks all later local work.

The pre-existing requirement ("the `SolidEngine` SHALL be used only within the synchronization layer via a scoped `withEngine`") was already satisfied in letter — the scoping existed — while being violated in effect. The spec change is therefore about what "scoped" has to mean under concurrency.

## Goals / Non-Goals

**Goals:**
- A local operation always reaches the local engine; a Pod operation always reaches the intended Pod engine.
- The global engine after any operation is the same as before it, whether the operation succeeded or failed.
- One place in the code decides which engine an operation runs on, so new call sites cannot reintroduce the bug quietly.

**Non-Goals:**
- Removing the dependency on Soukai's global engine (e.g. per-model engine binding, or forking Soukai). Out of proportion to the problem.
- Concurrency *within* one engine — IndexedDB transactions already handle that. This is only about which engine is installed.
- Making the sync itself concurrent, or speeding it up.
- Cancelling or timing out a Pod operation. See Risks.

## Decisions

### Decision 1: Serialize all engine access through one gate
A single module (`engineScope.ts`) chains every engine-scoped operation onto one promise: `withLocalEngine(op)` runs `op` under the default engine, `withRemoteEngine(engine, op)` wraps it in `withEngine`. Because at most one is in flight, no swap window can ever contain unrelated work, and windows cannot overlap — which removes both failure modes at once.

- **Why serialize local work too?** The bug is a *pair* — a Pod window plus a concurrent local operation. Gating only the Pod side would leave local reads free to resume inside the window. Routing both through one chain is what makes the invariant hold.
- **Alternative considered:** a read-write lock allowing concurrent local operations while excluding Pod ones. Rejected as unnecessary complexity: local IndexedDB operations are fast, and the simple chain is small enough to reason about.
- **Alternative considered:** pass an explicit engine to every model call. Soukai's API does not offer this; it would mean patching or forking the library.

### Decision 2: A failed operation must not wedge the chain
The chain advances on a `catch`-swallowed continuation, so a rejected operation still releases the gate for the ones queued behind it (the rejection is propagated to its own caller, not to them).

### Decision 3: The gate is deliberately not reentrant
Calling a gate helper from inside another one would deadlock — the inner call waits for the outer to finish. Rather than add reentrancy tracking, the constraint is documented in the module header and the scopes are kept at the leaves, directly around the Soukai calls. In `SolidSyncService.sweep` this means gating per block (local read, remote read, `synchronize` + local save, remote save, creates) rather than wrapping the whole method.

- **Why not make it reentrant?** Reentrancy would have to distinguish "same logical operation" from "a different operation that happens to be nested", which is exactly the ambiguity that caused the original bug. A flat, leaf-level discipline is easier to verify by reading the code.

### Decision 4: Keep the guarantee testable
The gate is a plain module with no DOM or Solid dependency, so it can be tested in the `node` vitest environment with a stub engine that records the containers it is asked to read and can be held open across awaits. One test asserts the invariant; a companion test asserts that a *bare* `withEngine` window does misroute a concurrent local read, so the reason the gate exists cannot be silently deleted.

## Risks / Trade-offs

- **[A local read issued during a sync now waits instead of failing]** → It queues behind the sync's current *step*, not the whole run, because the sweep is gated per block. A slow Pod request delays UI reads for that one step; a hung request would stall them until it times out. Accepted: waiting briefly is strictly better than the read being sent to the Pod and throwing.
- **[The gate is not reentrant — a nested call deadlocks]** → Documented in the module header; scopes kept at the leaves. A future nested call would hang rather than fail loudly, which is the main maintenance hazard here.
- **[A new engine-touching call site could bypass the gate]** → Mitigated by `fetchLive` covering all repository reads (so the common path is gated by construction) and by the companion test that documents the failure mode. Not enforced mechanically.
- **[Serialization hides genuine parallelism opportunities]** → Accepted; correctness first. If sync throughput ever matters, the read-write-lock variant from Decision 1 is the next step.

## Migration Plan

Code-only; no data, Pod-layout, or API change. Rollback = replace the gate helpers with direct calls (`withLocalEngine(op)` → `op()`, `withRemoteEngine(e, op)` → `withEngine(e, op)`), which restores the previous behaviour including the bug.

## Open Questions

None.
