import { describe, expect, it } from "vitest";
import { estimateNet, estimateSplit, formatManila, formatPHP, parsePesoInput, INTRO_FEE_CENTAVOS, REGULAR_FEE_CENTAVOS } from "@/lib/money";

describe("wallet display arithmetic (display-only)", () => {
  it("formats PHP with two decimals and grouping", () => {
    expect(formatPHP(960_100)).toBe("₱9,601.00");
    expect(formatPHP(1)).toBe("₱0.01");
    expect(formatPHP(-39_900)).toBe("−₱399.00");
  });
  it("rejects non-integer centavos", () => {
    expect(() => formatPHP(10.5)).toThrow();
  });
  it("splits Q=₱10,000 into ₱7,000 / ₱3,000", () => {
    expect(estimateSplit(1_000_000)).toEqual({ p1: 700_000, p2: 300_000 });
  });
  it("splits odd-cent Q=₱1,000.01 into ₱700.01 / ₱300.00 summing exactly", () => {
    const s = estimateSplit(100_001);
    expect(s).toEqual({ p1: 70_001, p2: 30_000 });
    expect(s.p1 + s.p2).toBe(100_001);
  });
  it("rejects non-positive quote totals", () => {
    expect(() => estimateSplit(0)).toThrow();
  });
  it("estimates ₱9,601 intro and ₱9,000 regular net on ₱10,000 gross", () => {
    expect(estimateNet(1_000_000, INTRO_FEE_CENTAVOS)).toBe(960_100);
    expect(estimateNet(1_000_000, REGULAR_FEE_CENTAVOS)).toBe(900_000);
  });
  it("sends below-fee bookings to review instead of a negative payable", () => {
    expect(estimateNet(50_000, REGULAR_FEE_CENTAVOS)).toBeNull();
  });
  it("parses peso input without floats", () => {
    expect(parsePesoInput("35,000.50")).toBe(3_500_050);
    expect(parsePesoInput("0.1")).toBe(10);
    expect(parsePesoInput("abc")).toBeNull();
    expect(parsePesoInput("1.234")).toBeNull();
  });
  it("renders times in Asia/Manila with explicit timezone", () => {
    expect(formatManila("2026-01-01T00:00:00Z")).toMatch(/08:00 PHT \(Asia\/Manila\)$/);
  });
});
