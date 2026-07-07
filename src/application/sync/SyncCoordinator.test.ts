import {describe, it, expect} from "vitest";
import {SyncCoordinator} from "./SyncCoordinator.ts";
import {SynchronizeWithPod} from "./SynchronizeWithPod.ts";
import {NotAuthenticatedError} from "../errors.ts";
import type {AuthService, SolidSession} from "../ports/AuthService.ts";

const session: SolidSession = {isLoggedIn: true, webId: "https://alice.pod/profile#me", fetch};
const loggedIn: AuthService = {isLoggedIn: () => true, getSession: () => session};
const loggedOut: AuthService = {isLoggedIn: () => false, getSession: () => ({isLoggedIn: false, webId: null, fetch})};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** A SynchronizeWithPod whose runs complete only when we release them. */
function controllable() {
    const resolvers: Array<() => void> = [];
    let calls = 0;
    const synchronize = {
        execute: () => {
            calls++;
            return new Promise<{reconciled: number}>((resolve) => resolvers.push(() => resolve({reconciled: 0})));
        },
    } as unknown as SynchronizeWithPod;
    return {synchronize, resolvers, calls: () => calls};
}

describe("SyncCoordinator", () => {
    it("coalesces triggers fired during an in-flight run into a single follow-up run", async () => {
        const {synchronize, resolvers, calls} = controllable();
        const coordinator = new SyncCoordinator(loggedIn, synchronize);

        void coordinator.requestSync("manual"); // run 1 starts
        await flush();
        expect(calls()).toBe(1);

        void coordinator.requestSync("manual"); // coalesced
        void coordinator.requestSync("reconnect"); // coalesced into the SAME follow-up
        expect(calls()).toBe(1);

        resolvers[0](); // finish run 1 → exactly one follow-up run starts
        await flush();
        expect(calls()).toBe(2);

        resolvers[1](); // finish run 2 → no further runs
        await flush();
        expect(calls()).toBe(2);
    });

    it("skips the reconnect trigger silently when there is no session", async () => {
        const {synchronize, calls} = controllable();
        const coordinator = new SyncCoordinator(loggedOut, synchronize);
        await coordinator.requestSync("reconnect");
        expect(calls()).toBe(0);
        expect(coordinator.getStatus().state).toBe("idle");
    });

    it("throws NotAuthenticatedError on a manual trigger without a session", async () => {
        const {synchronize} = controllable();
        const coordinator = new SyncCoordinator(loggedOut, synchronize);
        await expect(coordinator.requestSync("manual")).rejects.toBeInstanceOf(NotAuthenticatedError);
    });

    it("reports error state when a run fails and leaves local data intact", async () => {
        const failing = {execute: () => Promise.reject(new Error("network down"))} as unknown as SynchronizeWithPod;
        const coordinator = new SyncCoordinator(loggedIn, failing);
        await coordinator.requestSync("manual");
        expect(coordinator.getStatus().state).toBe("error");
        expect(coordinator.getStatus().error).toContain("network down");
    });
});
