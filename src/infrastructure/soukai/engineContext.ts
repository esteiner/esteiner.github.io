import {setAsyncContextManager, type AsyncContextManager, type Engine} from "soukai-bis";

/**
 * A synchronous swap-based engine context manager.
 *
 * soukai-bis's `runWithEngine` delegates to an app-provided `AsyncContextManager`
 * and ships none — and the browser has no `AsyncLocalStorage`. This restores the
 * scoped engine after the operation's promise settles, so a scoped engine stays
 * installed for the whole (async) operation. Overlapping scopes would clobber one
 * another's saved `previous`, which is exactly why `engineScope.ts` serializes
 * every scoped operation: with the gate, at most one runs at a time.
 */
class SwapEngineContextManager implements AsyncContextManager<Engine> {

    private current: Engine | undefined;

    runWithValue<T>(engine: Engine, operation: () => T): T {
        const previous = this.current;
        this.current = engine;
        let result: T;
        try {
            result = operation();
        } catch (error) {
            this.current = previous;
            throw error;
        }
        if (result instanceof Promise) {
            return result.finally(() => {
                this.current = previous;
            }) as unknown as T;
        }
        this.current = previous;
        return result;
    }

    getValue(): Engine | undefined {
        return this.current;
    }
}

let installed = false;

/**
 * Install the engine context manager exactly once. Required before any
 * `runWithEngine` call (i.e. before `withRemoteEngine`). Idempotent.
 */
export function installEngineContextManager(): void {
    if (installed) {
        return;
    }
    setAsyncContextManager(new SwapEngineContextManager());
    installed = true;
}
