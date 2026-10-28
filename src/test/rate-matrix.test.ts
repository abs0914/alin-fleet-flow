import { describe, expect, it, vi } from "vitest";
import {
  CONTAINER_LENGTH_OPTIONS, RATE_ISSUES, RATE_MATRIX, RATE_ROWS, UNCONFIRMED, canCiteAsReference, filterRows, pesosToCentavos, supportsContainerLength,
} from "@/lib/reference/rateMatrix";
import { createDemoBackend } from "@/lib/demo/backend";

const row = (d: string, e: "20FTR" | "40FTR") => RATE_ROWS.find((r) => r.destination === d && r.equipmentLabel === e);

describe("VUTAI rate matrix reference (DRAFT)", () => {
  it("has exactly 30 rows, 15 destinations × 20FTR/40FTR", () => {
    expect(RATE_ROWS).toHaveLength(30);
    expect(new Set(RATE_ROWS.map((r) => r.destination)).size).toBe(15);
    expect(RATE_ROWS.filter((r) => r.equipmentLabel === "20FTR")).toHaveLength(15);
  });

  it.each([
    ["CITY LIMITS", "20FTR", [6000, 7000, 8000, 9000]],
    ["CITY LIMITS", "40FTR", [7000, 8000, 9000, 10000]],
    ["MANDAUE AFTER", "20FTR", [7000, 8000, 9000, 10000]],
    ["MANDAUE AFTER", "40FTR", [8000, 9000, 10000, 11000]],
    ["BUTUANON RIVER", "20FTR", [8000, 9000, 10000, 11000]],
    ["BUTUANON RIVER", "40FTR", [9000, 10000, 11000, 12000]],
    ["CONSOLACION", "20FTR", [9000, 10000, 11000, 12000]],
    ["CONSOLACION", "40FTR", [10000, 11000, 12000, 13000]],
    ["LILOAN", "20FTR", [10000, 11000, 12000, 14000]],
    ["LILOAN", "40FTR", [11000, 12000, 13000, 14000]],
    ["COMPOSTELA", "20FTR", [11000, 12000, 13000, 14000]],
    ["COMPOSTELA", "40FTR", [12000, 13000, 14000, 15000]],
    ["LAPULAPU CITY PROPER", "20FTR", [7000, 8000, 9000, 10000]],
    ["LAPULAPU CITY PROPER", "40FTR", [8000, 9000, 10000, 11000]],
    ["MEPZ 1", "20FTR", [7000, 8000, 9000, 10000]],
    ["MEPZ 1", "40FTR", [8000, 9000, 10000, 11000]],
    ["MEPZ 2", "20FTR", [8000, 9000, 10000, 11000]],
    ["MEPZ 2", "40FTR", [9000, 10000, 11000, 12000]],
    ["TALISAY", "20FTR", [7500, 8500, 9500, 10500]],
    ["TALISAY", "40FTR", [8500, 9500, 10500, 11500]],
    ["MINGLANILLA", "20FTR", [8500, 9500, 10500, 11500]],
    ["MINGLANILLA", "40FTR", [9500, 105000, 11500, 12500]],
    ["NAGA", "20FTR", [10500, 11500, 12500, 13500]],
    ["NAGA", "40FTR", [11500, 12500, 13500, 14500]],
    ["SAN FERNANDO", "20FTR", [11500, 12500, 13500, 14500]],
    ["SAN FERNANDO", "40FTR", [12500, 13500, 14500, 15500]],
    ["MARIGONDON/NEWTOWN", "20FTR", [9000, 10000, 11000, 12000]],
    ["MARIGONDON/NEWTOWN", "40FTR", [10000, 11000, 12000, 13000]],
    ["CORDOVA/PUNTAENGANO", "20FTR", [10000, 11000, 12000, 13000]],
    ["CORDOVA/PUNTAENGANO", "40FTR", [11000, 12000, 13000, 14000]],
  ] as const)("%s %s matches the sheet exactly (totals as printed, no surcharge added)", (d, e, amounts) => {
    expect(row(d, e)?.amountsPesos).toEqual(amounts);
  });

  it("Minglanilla 40FTR 51–69 keeps raw 105,000, flagged and blocked as a proposal reference", () => {
    const r = row("MINGLANILLA", "40FTR");
    if (!r) throw new Error("missing");
    expect(r.amountsPesos[1]).toBe(105000);
    expect(r.reviewRequired).toBe(true);
    expect(canCiteAsReference(r, 1)).toBe(false);
    expect(RATE_ISSUES.find((i) => i.destination === "MINGLANILLA")?.band).toBe("51-69");
  });

  it("Liloan 20FTR 90–109 keeps raw 14,000, flagged and blocked", () => {
    const r = row("LILOAN", "20FTR");
    if (!r) throw new Error("missing");
    expect(r.amountsPesos[3]).toBe(14000);
    expect(canCiteAsReference(r, 3)).toBe(false);
    expect(canCiteAsReference(r, 0)).toBe(true);
    expect(RATE_ISSUES).toHaveLength(2);
  });

  it("equipment is container length (20/40 ft), not wheel count or category", () => {
    expect(CONTAINER_LENGTH_OPTIONS).toEqual([20, 40]);
    expect(RATE_ROWS.every((r) => (r.equipmentLabel === "20FTR" ? 20 : 40) === r.containerLengthFt)).toBe(true);
    expect(supportsContainerLength("Tractor head")).toBe(true);
    expect(supportsContainerLength("Trailer")).toBe(true);
    for (const t of ["10-wheeler", "Reefer", "Boom truck", "Long-haul", undefined]) expect(supportsContainerLength(t)).toBe(false);
    expect(RATE_ROWS.some((r) => "capacityKg" in r || "dimensionsCm" in r)).toBe(false);
  });

  it("keeps VAT/extras labels literal and unconfirmed", () => {
    expect(RATE_MATRIX.sourceTitle).toBe("VUTAI LOCAL TRUCKING BOBTAIL (PUTOL) RATES 2026 EXCLUSIVE OF VAT");
    expect(RATE_MATRIX.vatTreatment).toBe("EXCLUSIVE_OF_VAT_TAX_RULE_UNCONFIRMED");
    expect(RATE_MATRIX.originLabel).toBe("CIP");
    expect(RATE_MATRIX.bandUnit).toBeNull();
    expect(RATE_MATRIX.bandLabels).toEqual(["CURRENT RATE UP TO 50", "51-69", "70-89", "90-109"]);
    expect(RATE_MATRIX.headerAdditionalFuelSurcharges).toEqual([1000, 1000, 1000]);
    expect(RATE_MATRIX.southHarborAdditionalPesos).toBe(500);
    expect(UNCONFIRMED).toHaveLength(9);
    expect(JSON.stringify(RATE_MATRIX)).not.toMatch(/12%|vatRate|effectiveDate/i);
  });

  it("converts whole pesos to integer centavos only", () => {
    expect(pesosToCentavos(7500)).toBe(750_000);
    expect(() => pesosToCentavos(1.5)).toThrow(RangeError);
    expect(() => pesosToCentavos(-1)).toThrow(RangeError);
  });

  it("filters by destination, equipment and search", () => {
    expect(filterRows({ equipment: "40FTR" })).toHaveLength(15);
    expect(filterRows({ destination: "NAGA" })).toHaveLength(2);
    expect(filterRows({ search: "mepz" })).toHaveLength(4);
    expect(filterRows({ flaggedOnly: true }).map((r) => r.destination).sort()).toEqual(["LILOAN", "MINGLANILLA"]);
  });

  it("is frozen and using it never calls price/payment operations", async () => {
    expect(Object.isFrozen(RATE_ROWS)).toBe(true);
    const demo = createDemoBackend();
    const spy = vi.spyOn(demo, "handle");
    filterRows({ equipment: "20FTR", search: "talisay" });
    for (const r of RATE_ROWS) for (let i = 0; i < 4; i++) canCiteAsReference(r, i);
    expect(spy).not.toHaveBeenCalled();
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/lib/reference/rateMatrix.ts", "utf8");
    expect(src).not.toMatch(/^import /m);
    expect(src).not.toMatch(/useCommand|fetch\(|\.mutate\(/);
  });
});
