import {describe, it, expect} from "vitest";
import {ReconnectSync} from "./ReconnectSync.ts";
import {SyncCoordinator} from "./SyncCoordinator.ts";
import {SynchronizeWithPod} from "./SynchronizeWithPod.ts";
import type {AuthService, SolidSession} from "../ports/AuthService.ts";

const session: SolidSession = {isLoggedIn: true, webId: "https://alice.pod/profile#me", fetch};
const loggedIn: AuthService = {isLoggedIn: () => true, getSession: () => session};
const loggedOut: AuthService = {isLoggedIn: () => false, getSession: () => ({isLoggedIn: false, webId: null, fetch})};

const noDelay = () => Promise.resolve();

function counting() {
    let calls = 0;
    const synchronize = {execute: () => { calls++; return Promise.resolve({reconciled: 0}); }} as unknown as SynchronizeWithPod;
    return {synchronize, calls: () => calls};
}

describe("ReconnectSync (post-login trigger)", () => {
    it("runs a sync when a session exists", async () => {
        const {synchronize, calls} = counting();
        const coordinator = new SyncCoordinator(loggedIn, synchronize);
        await new ReconnectSync(coordinator, {maxRetries: 4, baseDelayMs: 1, delay: noDelay}).run();
        expect(calls()).toBe(1);
    });

    it("is a silent no-op when there is no session (does not throw, does not sync)", async () => {
        const {synchronize, calls} = counting();
        const coordinator = new SyncCoordinator(loggedOut, synchronize);
        await new ReconnectSync(coordinator, {maxRetries: 4, baseDelayMs: 1, delay: noDelay}).run();
        expect(calls()).toBe(0);
        expect(coordinator.getStatus().state).toBe("idle");
    });

    it("retries with backoff while the run keeps failing, then gives up", async () => {
        let calls = 0;
        const failing = {execute: () => { calls++; return Promise.reject(new Error("network down")); }} as unknown as SynchronizeWithPod;
        const coordinator = new SyncCoordinator(loggedIn, failing);
        await new ReconnectSync(coordinator, {maxRetries: 2, baseDelayMs: 1, delay: noDelay}).run();
        // Initial attempt + 2 retries.
        expect(calls).toBe(3);
        expect(coordinator.getStatus().state).toBe("error");
    });
});
