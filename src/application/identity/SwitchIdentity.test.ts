import {describe, it, expect} from "vitest";
import {SwitchIdentity} from "./SwitchIdentity.ts";
import {fakeAppState} from "../sync/appStateStore.fake.ts";
import type {LocalDataStore} from "../ports/LocalDataStore.ts";

const A = "https://alice.pod/profile#me";
const B = "https://bob.pod/profile#me";

/** A LocalDataStore that records when it was wiped, relative to the marker write. */
function recordingStore(events: string[], onWipe?: () => void): LocalDataStore {
    return {
        wipe: async () => {
            events.push("wipe");
            onWipe?.();
        },
    };
}

describe("SwitchIdentity", () => {

    describe("check", () => {
        it("reports a switch when the WebID differs from the recorded one", async () => {
            const app = fakeAppState({webId: A});
            const check = await new SwitchIdentity(app.store, recordingStore([])).check(B);
            expect(check).toEqual({kind: "wipe-required", previousWebId: A});
        });

        it("proceeds for the same WebID", async () => {
            const app = fakeAppState({webId: A});
            expect(await new SwitchIdentity(app.store, recordingStore([])).check(A)).toEqual({kind: "proceed"});
        });

        it("proceeds on first use, so pre-login data survives", async () => {
            const app = fakeAppState(); // nothing recorded yet
            expect(await new SwitchIdentity(app.store, recordingStore([])).check(A)).toEqual({kind: "proceed"});
        });
    });

    describe("switchTo", () => {
        it("wipes the previous identity's data and records the new WebID", async () => {
            const events: string[] = [];
            const app = fakeAppState({webId: A});

            expect(await new SwitchIdentity(app.store, recordingStore(events)).switchTo(B)).toBe(true);

            expect(events).toEqual(["wipe"]);
            expect(app.getWebId()).toBe(B);
        });

        it("records the new WebID only AFTER the wipe", async () => {
            // The wipe deletes the store holding the marker, so recording first
            // would erase it again.
            const events: string[] = [];
            const app = fakeAppState({webId: A});
            const store = recordingStore(events, () => events.push(`marker:${app.getWebId()}`));

            await new SwitchIdentity(app.store, store).switchTo(B);

            // At wipe time the marker was still the OLD one — it had not been written yet.
            expect(events).toEqual(["wipe", `marker:${A}`]);
            expect(app.getWebId()).toBe(B);
        });

        it("does not wipe for the same WebID", async () => {
            const events: string[] = [];
            const app = fakeAppState({webId: A});

            expect(await new SwitchIdentity(app.store, recordingStore(events)).switchTo(A)).toBe(false);

            expect(events).toEqual([]);
            expect(app.getWebId()).toBe(A);
        });

        it("does not wipe on first use but records the identity", async () => {
            const events: string[] = [];
            const app = fakeAppState();

            expect(await new SwitchIdentity(app.store, recordingStore(events)).switchTo(A)).toBe(false);

            expect(events).toEqual([]);
            expect(app.getWebId()).toBe(A);
        });

        it("is idempotent: re-running the same switch wipes only once", async () => {
            const events: string[] = [];
            const app = fakeAppState({webId: A});
            const identity = new SwitchIdentity(app.store, recordingStore(events));

            await identity.switchTo(B);
            await identity.switchTo(B); // e.g. the callback fires twice

            expect(events).toEqual(["wipe"]);
            expect(app.getWebId()).toBe(B);
        });

        it("counts as first use when recording the marker fails after the wipe", async () => {
            // Interrupted switch: the data is already gone, so the next login must
            // NOT treat the previous identity as the owner of the local store.
            const app = fakeAppState({webId: A});
            const store = {
                ...app.store,
                setWebId: async () => { throw new Error("db closed"); },
            };

            await expect(new SwitchIdentity(store, recordingStore([])).switchTo(B)).rejects.toThrow("db closed");

            // No marker survives the failure, so the next check reports first use.
            const afterCrash = fakeAppState(); // the app-state database was deleted
            expect(await new SwitchIdentity(afterCrash.store, recordingStore([])).check(B)).toEqual({kind: "proceed"});
        });

        it("leaves no marker when the wipe fails, so the switch can be retried", async () => {
            const app = fakeAppState({webId: A});
            const failing: LocalDataStore = {wipe: async () => { throw new Error("purge blocked"); }};

            await expect(new SwitchIdentity(app.store, failing).switchTo(B)).rejects.toThrow("purge blocked");

            // Still the previous identity: the switch did not silently half-happen.
            expect(app.getWebId()).toBe(A);
        });
    });
});
