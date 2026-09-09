import {describe, it, expect, vi, afterEach} from "vitest";
import {HttpOrderConversionService} from "./HttpOrderConversionService.ts";

const ENDPOINT = "https://convert.example/orders";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("HttpOrderConversionService", () => {

    it("is unavailable (with a reason) when the endpoint is not configured", () => {
        const service = new HttpOrderConversionService(undefined);
        const availability = service.availability();
        expect(availability.available).toBe(false);
        expect(availability.available ? "" : availability.reason).toMatch(/konfiguriert/i);
    });

    it("rejects convert when the endpoint is not configured (no request made)", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch");
        const service = new HttpOrderConversionService(undefined);

        await expect(service.convert(new Blob([new Uint8Array([1])]), new Blob([new Uint8Array([2])]))).rejects.toThrow();
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("POSTs both images as base64 under front/back and returns the Turtle body", async () => {
        const turtle = "@prefix schema: <https://schema.org/> . <#o> a schema:Order .";
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(turtle, {status: 200}));
        const service = new HttpOrderConversionService(ENDPOINT);

        const result = await service.convert(
            new Blob([new Uint8Array([1, 2, 3])]),
            new Blob([new Uint8Array([4, 5, 6])]),
        );

        expect(result).toBe(turtle);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const [url, init] = fetchSpy.mock.calls[0];
        expect(url).toBe(ENDPOINT);
        expect(init?.method).toBe("POST");
        expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
        const body = JSON.parse(init?.body as string);
        expect(body).toEqual({front: "AQID", back: "BAUG"});
    });

    it("rejects with the status when the service responds non-2xx", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", {status: 502, statusText: "Bad Gateway"}));
        const service = new HttpOrderConversionService(ENDPOINT);

        await expect(service.convert(new Blob([new Uint8Array([1])]), new Blob([new Uint8Array([2])]))).rejects.toThrow(/502/);
    });

    it("rejects when the request fails at the transport level", async () => {
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
        const service = new HttpOrderConversionService(ENDPOINT);

        await expect(service.convert(new Blob([new Uint8Array([1])]), new Blob([new Uint8Array([2])]))).rejects.toThrow("network down");
    });
});
