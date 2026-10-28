/**
 * VUTAI rate matrix — DRAFT, REFERENCE ONLY.
 * Transcribed from a stakeholder-supplied image. It is NOT ALiN pricing, does not
 * set any quote, fee, wallet, hold, capture or settlement value, and is never sent
 * to the backend. Production pricing authority is the existing backend catalog.
 * Unconfirmed items are listed in UNCONFIRMED and must not be resolved by guessing.
 */
export type EquipmentLabel = "20FTR" | "40FTR";
export type BandLabel = "CURRENT RATE UP TO 50" | "51-69" | "70-89" | "90-109";

export interface RateRow {
  readonly destination: string;
  readonly equipmentLabel: EquipmentLabel;
  /** Container length option only. Dimensions/capacity are NOT inferred from length. */
  readonly containerLengthFt: 20 | 40;
  /** Whole pesos exactly as printed (row totals as shown; no surcharge added). */
  readonly amountsPesos: readonly [number, number, number, number];
  readonly reviewRequired: boolean;
}

export interface RateIssue { readonly destination: string; readonly equipment: EquipmentLabel; readonly band: BandLabel; readonly rawPesos: number; readonly note: string }

export const RATE_MATRIX = {
  status: "DRAFT",
  usage: "REFERENCE_ONLY",
  sourceTitle: "VUTAI LOCAL TRUCKING BOBTAIL (PUTOL) RATES 2026 EXCLUSIVE OF VAT",
  sourceFile: "d92e453d-429b-49bf-9f11-b75f7f59a793.jpg",
  sourceYear: 2026,
  /** Printed as "CIP TO". Not expanded; boundary unconfirmed. */
  originLabel: "CIP",
  currency: "PHP",
  vatTreatment: "EXCLUSIVE_OF_VAT_TAX_RULE_UNCONFIRMED",
  bandLabels: ["CURRENT RATE UP TO 50", "51-69", "70-89", "90-109"] as const satisfies readonly BandLabel[],
  /** Unit not printed; unconfirmed. */
  bandUnit: null,
  /** Header shows 1000 under each additional-surcharge column. Interpretation vs row totals unconfirmed. */
  headerAdditionalFuelSurcharges: [1000, 1000, 1000] as const,
  /** Conditional note only — never auto-applied. */
  southHarborAdditionalPesos: 500,
} as const;

export const RATE_ROWS: readonly RateRow[] = Object.freeze([
  { destination: "CITY LIMITS", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [6000, 7000, 8000, 9000], reviewRequired: false },
  { destination: "CITY LIMITS", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [7000, 8000, 9000, 10000], reviewRequired: false },
  { destination: "MANDAUE AFTER", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [7000, 8000, 9000, 10000], reviewRequired: false },
  { destination: "MANDAUE AFTER", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [8000, 9000, 10000, 11000], reviewRequired: false },
  { destination: "BUTUANON RIVER", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [8000, 9000, 10000, 11000], reviewRequired: false },
  { destination: "BUTUANON RIVER", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [9000, 10000, 11000, 12000], reviewRequired: false },
  { destination: "CONSOLACION", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [9000, 10000, 11000, 12000], reviewRequired: false },
  { destination: "CONSOLACION", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [10000, 11000, 12000, 13000], reviewRequired: false },
  { destination: "LILOAN", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [10000, 11000, 12000, 14000], reviewRequired: true },
  { destination: "LILOAN", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [11000, 12000, 13000, 14000], reviewRequired: false },
  { destination: "COMPOSTELA", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [11000, 12000, 13000, 14000], reviewRequired: false },
  { destination: "COMPOSTELA", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [12000, 13000, 14000, 15000], reviewRequired: false },
  { destination: "LAPULAPU CITY PROPER", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [7000, 8000, 9000, 10000], reviewRequired: false },
  { destination: "LAPULAPU CITY PROPER", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [8000, 9000, 10000, 11000], reviewRequired: false },
  { destination: "MEPZ 1", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [7000, 8000, 9000, 10000], reviewRequired: false },
  { destination: "MEPZ 1", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [8000, 9000, 10000, 11000], reviewRequired: false },
  { destination: "MEPZ 2", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [8000, 9000, 10000, 11000], reviewRequired: false },
  { destination: "MEPZ 2", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [9000, 10000, 11000, 12000], reviewRequired: false },
  { destination: "TALISAY", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [7500, 8500, 9500, 10500], reviewRequired: false },
  { destination: "TALISAY", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [8500, 9500, 10500, 11500], reviewRequired: false },
  { destination: "MINGLANILLA", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [8500, 9500, 10500, 11500], reviewRequired: false },
  { destination: "MINGLANILLA", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [9500, 105000, 11500, 12500], reviewRequired: true },
  { destination: "NAGA", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [10500, 11500, 12500, 13500], reviewRequired: false },
  { destination: "NAGA", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [11500, 12500, 13500, 14500], reviewRequired: false },
  { destination: "SAN FERNANDO", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [11500, 12500, 13500, 14500], reviewRequired: false },
  { destination: "SAN FERNANDO", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [12500, 13500, 14500, 15500], reviewRequired: false },
  { destination: "MARIGONDON/NEWTOWN", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [9000, 10000, 11000, 12000], reviewRequired: false },
  { destination: "MARIGONDON/NEWTOWN", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [10000, 11000, 12000, 13000], reviewRequired: false },
  { destination: "CORDOVA/PUNTAENGANO", equipmentLabel: "20FTR", containerLengthFt: 20, amountsPesos: [10000, 11000, 12000, 13000], reviewRequired: false },
  { destination: "CORDOVA/PUNTAENGANO", equipmentLabel: "40FTR", containerLengthFt: 40, amountsPesos: [11000, 12000, 13000, 14000], reviewRequired: false },
]);

export const RATE_ISSUES: readonly RateIssue[] = Object.freeze([
  { destination: "MINGLANILLA", equipment: "40FTR", band: "51-69", rawPesos: 105000, note: "Image reads 105,000. Possible typo; no corrected value approved." },
  { destination: "LILOAN", equipment: "20FTR", band: "90-109", rawPesos: 14000, note: "Image reads 14,000; jump differs from adjacent +1,000 pattern. Preserve; confirm." },
]);

export const UNCONFIRMED: readonly string[] = Object.freeze([
  "CIP origin expansion/location boundary",
  "CITY LIMITS and MANDAUE AFTER boundaries",
  "BOBTAIL (PUTOL) operational definition",
  "fuel-band units and effective source/date",
  "band boundary/decimal handling and values above 109",
  "header incremental surcharge vs displayed total interpretation",
  "South Harbor applicability and one-way/return-trip scope",
  "VAT rate and taxable base",
  "operator approval to use as commercial ALiN pricing",
]);

/** Integer centavos for display. Pure; never used to set a price. */
export const pesosToCentavos = (p: number): number => {
  if (!Number.isSafeInteger(p) || p < 0) throw new RangeError("Reference amounts must be nonnegative whole pesos.");
  return p * 100;
};

export function issueFor(row: RateRow, bandIndex: number): RateIssue | undefined {
  const band = RATE_MATRIX.bandLabels[bandIndex];
  return RATE_ISSUES.find((i) => i.destination === row.destination && i.equipment === row.equipmentLabel && i.band === band);
}

/**
 * Whether a cell may be cited as a manual reference while drafting a proposal.
 * Flagged cells are blocked. Even usable cells never change any amount automatically.
 */
export function canCiteAsReference(row: RateRow, bandIndex: number): boolean {
  if (bandIndex < 0 || bandIndex > 3) return false;
  return issueFor(row, bandIndex) === undefined;
}

export interface RateFilter { search?: string; equipment?: EquipmentLabel | "all"; destination?: string | "all"; flaggedOnly?: boolean }

export function filterRows(f: RateFilter, rows: readonly RateRow[] = RATE_ROWS): RateRow[] {
  const s = (f.search ?? "").trim().toUpperCase();
  return rows.filter((r) =>
    (!f.equipment || f.equipment === "all" || r.equipmentLabel === f.equipment) &&
    (!f.destination || f.destination === "all" || r.destination === f.destination) &&
    (!f.flaggedOnly || r.reviewRequired) &&
    (!s || r.destination.includes(s) || r.equipmentLabel.includes(s)),
  );
}

export const DESTINATIONS: readonly string[] = Object.freeze([...new Set(RATE_ROWS.map((r) => r.destination))]);

/** Equipment taxonomy: container LENGTH option, not wheel count; applies to tractor head/container/trailer only. */
export const CONTAINER_LENGTH_CATEGORY_TAXONOMIES: readonly string[] = Object.freeze(["Tractor head", "Trailer"]);
export const CONTAINER_LENGTH_OPTIONS = [20, 40] as const;
export type ContainerLengthFt = (typeof CONTAINER_LENGTH_OPTIONS)[number];
export const supportsContainerLength = (taxonomy: string | undefined): boolean =>
  taxonomy !== undefined && CONTAINER_LENGTH_CATEGORY_TAXONOMIES.includes(taxonomy);
