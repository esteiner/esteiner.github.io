import {describe, it, expect, vi} from "vitest";
import {SynchronizeWithPod} from "./SynchronizeWithPod.ts";
import {NotAuthenticatedError} from "../errors.ts";
import type {AuthService, SolidSession} from "../ports/AuthService.ts";
import type {SyncService} from "../ports/SyncService.ts";
import type {ReadModelCache} from "../ports/ReadModelCache.ts";

const session: SolidSession = {isLoggedIn: true, webId: "https://alice.pod/profile#me", fetch};
const loggedIn: AuthService = {isLoggedIn: () => true, getSession: () => session};
const loggedOut: AuthService = {isLoggedIn: () => false, getSession: () => ({isLoggedIn: false, webId: null, fetch})};

const succeeding: SyncService = {synchronize: async () => ({reconciled: 3})};
const failing: SyncService = {synchronize: async () => { throw new Error("network down"); }};

function fakeCache(): ReadModelCache & {invalidate: ReturnType<typeof vi.fn>} {
    return {invalidate: vi.fn()};
}

describe("SynchronizeWithPod", () => {

    it("drops the cached read models after a successful sync", async () => {
        const cache = fakeCache();

        await expect(new SynchronizeWithPod(loggedIn, succeeding, cache).execute()).resolves.toEqual({reconciled: 3});

        expect(cache.invalidate).toHaveBeenCalledOnce();
    });

    it("keeps the caches when the sync fails (nothing was reconciled for sure)", async () => {
        const cache = fakeCache();

        await expect(new SynchronizeWithPod(loggedIn, failing, cache).execute()).rejects.toThrow("network down");

        expect(cache.invalidate).not.toHaveBeenCalled();
    });

    it("does not touch the caches without a session", async () => {
        const cache = fakeCache();

        await expect(new SynchronizeWithPod(loggedOut, succeeding, cache).execute()).rejects.toBeInstanceOf(NotAuthenticatedError);

        expect(cache.invalidate).not.toHaveBeenCalled();
    });

    it("works without a cache", async () => {
        await expect(new SynchronizeWithPod(loggedIn, succeeding).execute()).resolves.toEqual({reconciled: 3});
    });
});
