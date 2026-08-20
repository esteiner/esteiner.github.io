import {describe, it, expect} from "vitest";
import {formatLastSync} from "./sync-status-format.ts";

describe("formatLastSync", () => {
    it("formats as d.M.yyyy@HH:mm (day/month unpadded, time zero-padded)", () => {
        expect(formatLastSync(new Date(2026, 6, 8, 22, 8))).toBe("8.7.2026@22:08");
    });

    it("zero-pads single-digit hours and minutes but not day or month", () => {
        expect(formatLastSync(new Date(2026, 0, 5, 9, 4))).toBe("5.1.2026@09:04");
    });
});
