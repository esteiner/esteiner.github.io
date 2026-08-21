/**
 * Unit tests for resolveKellermeisterContainer: it provisions the Kellermeister
 * base and per-collection subcontainers, then (as a safety net) re-verifies the
 * well-known cellars via the injected callback — after the subcontainers exist.
 */
import {describe, it, expect, vi, beforeEach} from "vitest";

const getSolidDataset = vi.fn();
const createContainerAt = vi.fn();

vi.mock("@inrupt/solid-client", () => ({
    getSolidDataset: (...args: unknown[]) => getSolidDataset(...args),
    createContainerAt: (...args: unknown[]) => createContainerAt(...args),
}));

const {resolveKellermeisterContainer} = await import("./podContainerResolution.ts");

const fakeFetch = (async () => new Response()) as unknown as typeof fetch;

beforeEach(() => {
    getSolidDataset.mockReset();
    createContainerAt.mockReset();
});

describe("resolveKellermeisterContainer", () => {

    it("invokes ensureWellKnownCellars after the containers are provisioned", async () => {
        // Every container is missing -> each getSolidDataset rejects, forcing creation.
        getSolidDataset.mockRejectedValue(new Error("404"));
        const order: string[] = [];
        createContainerAt.mockImplementation(async (url: string) => {
            order.push(`create:${url}`);
        });
        const ensureWellKnownCellars = vi.fn(async () => {
            order.push("ensure");
        });

        const base = await resolveKellermeisterContainer("https://alice.pod/", fakeFetch, ensureWellKnownCellars);

        expect(base).toBe("https://alice.pod/private/kellermeister/v1/");
        expect(ensureWellKnownCellars).toHaveBeenCalledTimes(1);
        // The ensure step runs only after all subcontainers have been created.
        expect(order[order.length - 1]).toBe("ensure");
        for (const collection of ["cellars", "bottles", "products", "orders"]) {
            expect(order).toContain(`create:https://alice.pod/private/kellermeister/v1/${collection}/`);
        }
    });

    it("works without a callback (no ensure step)", async () => {
        getSolidDataset.mockResolvedValue({});
        const base = await resolveKellermeisterContainer("https://alice.pod", fakeFetch);
        expect(base).toBe("https://alice.pod/private/kellermeister/v1/");
        expect(createContainerAt).not.toHaveBeenCalled();
    });
});
