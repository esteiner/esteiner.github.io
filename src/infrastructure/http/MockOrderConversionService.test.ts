import {describe, it, expect, vi, afterEach} from "vitest";
import {MockOrderConversionService} from "./MockOrderConversionService.ts";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("MockOrderConversionService", () => {

    it("is always available", () => {
        expect(new MockOrderConversionService().availability()).toEqual({available: true});
    });

    it("returns a fixed order Turtle without any network request", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch");
        const service = new MockOrderConversionService();

        const turtle = await service.convert(new Blob([new Uint8Array([1])]), new Blob([new Uint8Array([2])]));

        expect(turtle).toContain("a                     schema:Order");
        expect(turtle).toContain("Dhondt-Grellet Les Terres Fines 2021");
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
