/**
 * The rules here are invisible in the UI: which content type a file is stored
 * with (a Turtle order stored as an opaque binary would be silently ignored by
 * ingestion) and the session/container precondition.
 */
import {describe, it, expect, vi, beforeEach} from "vitest";

const saveFileInContainer = vi.fn();
const getSourceUrl = vi.fn();

vi.mock("@inrupt/solid-client", () => ({
    saveFileInContainer: (...args: unknown[]) => saveFileInContainer(...args),
    getSourceUrl: (...args: unknown[]) => getSourceUrl(...args),
}));

const {SolidInboxUploader, contentTypeOf} = await import("./SolidInboxUploader.ts");
import type {AuthService, SolidSession} from "../../application/ports/AuthService.ts";

const INBOX = "https://alice.pod/inbox/kellermeister/";
const authenticatedFetch = (async () => new Response()) as unknown as typeof fetch;

const loggedIn: AuthService = {
    isLoggedIn: () => true,
    getSession: (): SolidSession => ({isLoggedIn: true, webId: "https://alice.pod/profile#me", fetch: authenticatedFetch}),
};
const loggedOut: AuthService = {
    isLoggedIn: () => false,
    getSession: (): SolidSession => ({isLoggedIn: false, webId: null, fetch: authenticatedFetch}),
};

/** A File stand-in; `type` is "" for extensions the OS does not map (e.g. .ttl). */
function file(name: string, type = ""): File {
    return {name, type} as unknown as File;
}

beforeEach(() => {
    saveFileInContainer.mockReset();
    getSourceUrl.mockReset();
    saveFileInContainer.mockResolvedValue({});
    getSourceUrl.mockReturnValue(`${INBOX}server-chosen-name.ttl`);
});

describe("SolidInboxUploader", () => {

    it("uploads into the inbox container with the authenticated fetch", async () => {
        const order = file("order.ttl");

        await new SolidInboxUploader(loggedIn, () => INBOX).upload(order);

        expect(saveFileInContainer).toHaveBeenCalledOnce();
        const [container, uploaded, options] = saveFileInContainer.mock.calls[0];
        expect(container).toBe(INBOX);
        expect(uploaded).toBe(order); // passed through unvalidated
        expect(options.fetch).toBe(authenticatedFetch);
    });

    it("returns the URL the server created, not one derived from the file name", async () => {
        getSourceUrl.mockReturnValue(`${INBOX}order-2.ttl`);

        const url = await new SolidInboxUploader(loggedIn, () => INBOX).upload(file("order.ttl"));

        expect(url).toBe(`${INBOX}order-2.ttl`);
    });

    describe("content type", () => {
        it("falls back to text/turtle when the browser reports none", async () => {
            await new SolidInboxUploader(loggedIn, () => INBOX).upload(file("order.ttl"));

            expect(saveFileInContainer.mock.calls[0][2].contentType).toBe("text/turtle");
        });

        it("keeps a type the browser does report", async () => {
            await new SolidInboxUploader(loggedIn, () => INBOX).upload(file("order.json", "application/json"));

            expect(saveFileInContainer.mock.calls[0][2].contentType).toBe("application/json");
        });

        it("is decided by a pure helper", () => {
            expect(contentTypeOf(file("order.ttl"))).toBe("text/turtle");
            expect(contentTypeOf(file("a.json", "application/json"))).toBe("application/json");
        });
    });

    describe("several files", () => {
        it("uploads every file and reports them in the order chosen", async () => {
            getSourceUrl
                .mockReturnValueOnce(`${INBOX}a.ttl`)
                .mockReturnValueOnce(`${INBOX}b.ttl`)
                .mockReturnValueOnce(`${INBOX}c.ttl`);

            const outcomes = await new SolidInboxUploader(loggedIn, () => INBOX)
                .uploadAll([file("first.ttl"), file("second.ttl"), file("third.ttl")]);

            expect(saveFileInContainer).toHaveBeenCalledTimes(3);
            expect(outcomes).toEqual([
                {file: "first.ttl", ok: true, url: `${INBOX}a.ttl`},
                {file: "second.ttl", ok: true, url: `${INBOX}b.ttl`},
                {file: "third.ttl", ok: true, url: `${INBOX}c.ttl`},
            ]);
        });

        it("keeps going after a failure and preserves the earlier successes", async () => {
            saveFileInContainer
                .mockResolvedValueOnce({})
                .mockRejectedValueOnce(new Error("412 Precondition Failed"))
                .mockResolvedValueOnce({});
            getSourceUrl
                .mockReturnValueOnce(`${INBOX}a.ttl`)
                .mockReturnValueOnce(`${INBOX}c.ttl`);

            const outcomes = await new SolidInboxUploader(loggedIn, () => INBOX)
                .uploadAll([file("good.ttl"), file("bad.ttl"), file("also-good.ttl")]);

            // The rejection did not abort the batch, nor discard what came before it.
            expect(saveFileInContainer).toHaveBeenCalledTimes(3);
            expect(outcomes).toEqual([
                {file: "good.ttl", ok: true, url: `${INBOX}a.ttl`},
                {file: "bad.ttl", ok: false, message: "412 Precondition Failed"},
                {file: "also-good.ttl", ok: true, url: `${INBOX}c.ttl`},
            ]);
        });

        it("applies the content-type fallback per file", async () => {
            await new SolidInboxUploader(loggedIn, () => INBOX)
                .uploadAll([file("order.ttl"), file("note.json", "application/json")]);

            expect(saveFileInContainer.mock.calls[0][2].contentType).toBe("text/turtle");
            expect(saveFileInContainer.mock.calls[1][2].contentType).toBe("application/json");
        });

        it("uploads nothing for an empty selection", async () => {
            const outcomes = await new SolidInboxUploader(loggedIn, () => INBOX).uploadAll([]);

            expect(outcomes).toEqual([]);
            expect(saveFileInContainer).not.toHaveBeenCalled();
        });
    });

    describe("precondition", () => {
        it("is unavailable and uploads nothing without a session", async () => {
            const uploader = new SolidInboxUploader(loggedOut, () => INBOX);

            expect(uploader.availability()).toEqual({available: false, reason: "Nicht angemeldet."});
            await expect(uploader.upload(file("order.ttl"))).rejects.toThrow("Nicht angemeldet.");
            expect(saveFileInContainer).not.toHaveBeenCalled();
        });

        it("is unavailable and uploads nothing before the container is resolved", async () => {
            const uploader = new SolidInboxUploader(loggedIn, () => null);

            expect(uploader.availability()).toEqual({available: false, reason: "Pod-Container noch nicht aufgelöst."});
            await expect(uploader.upload(file("order.ttl"))).rejects.toThrow("Pod-Container noch nicht aufgelöst.");
            expect(saveFileInContainer).not.toHaveBeenCalled();
        });

        it("rejects a batch without attempting anything when unmet", async () => {
            const uploader = new SolidInboxUploader(loggedOut, () => INBOX);

            await expect(uploader.uploadAll([file("a.ttl"), file("b.ttl")])).rejects.toThrow("Nicht angemeldet.");
            expect(saveFileInContainer).not.toHaveBeenCalled();
        });

        it("is available with a session and a resolved container", () => {
            expect(new SolidInboxUploader(loggedIn, () => INBOX).availability()).toEqual({available: true});
        });
    });
});
