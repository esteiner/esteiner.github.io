import {describe, it, expect} from "vitest";
import {shouldRememberSync, syncFailureAction} from "./sync-ui-action.ts";
import {NotAuthenticatedError} from "../../application/errors.ts";

describe("syncFailureAction", () => {
    it("routes a missing session to the login flow (no hint)", () => {
        expect(syncFailureAction(new NotAuthenticatedError())).toEqual({kind: "login"});
    });

    it("maps any other error to a generic failure hint", () => {
        const action = syncFailureAction(new Error("network down"));
        expect(action.kind).toBe("hint");
        expect(action).toEqual({kind: "hint", message: "Synchronisierung fehlgeschlagen."});
    });

    it("treats a non-Error rejection as a generic failure hint (not login)", () => {
        expect(syncFailureAction("boom")).toEqual({kind: "hint", message: "Synchronisierung fehlgeschlagen."});
    });
});

describe("shouldRememberSync", () => {
    it("remembers a failed run so reconnecting completes it", () => {
        expect(shouldRememberSync("error")).toBe(true);
    });

    it("does not remember a successful run", () => {
        expect(shouldRememberSync("idle")).toBe(false);
    });

    it("does not remember a run that is still in flight (coalesced request)", () => {
        expect(shouldRememberSync("syncing")).toBe(false);
    });
});
