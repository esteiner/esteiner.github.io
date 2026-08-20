import {describe, it, expect} from "vitest";
import {syncFailureAction} from "./sync-ui-action.ts";
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
