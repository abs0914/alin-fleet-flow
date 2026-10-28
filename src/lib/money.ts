/**
 * DISPLAY-ONLY money helpers. All authoritative calculations (holds, captures,
 * fees, settlements, rounding) belong exclusively to the existing ALiN backend.
 * These helpers only format backend-provided integer centavos and produce
 * clearly labelled UI estimates.
 */

export type Centavos = number;

export const INTRO_FEE_CENTAVOS = 39_900; // ₱399 — shown only as a label; backend freezes the real fee
export const REGULAR_FEE_CENTAVOS = 100_000; // ₱1,000
export const CANCELLATION_HOLD_CENTAVOS = 100_000; // ₱1,000

export function assertCentavos(value: number): Centavos {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError("Amount must be a safe integer number of centavos");
  }
  return value;
}

/** Format centavos as PHP with exactly two decimals, e.g. ₱9,601.00. Integer-only arithmetic. */
export function formatPHP(centavos: Centavos): string {
  assertCentavos(centavos);
  const negative = centavos < 0;
  const abs = Math.abs(centavos);
  const pesos = Math.floor(abs / 100);
  const cents = abs % 100;
  const pesoStr = pesos.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "−" : ""}₱${pesoStr}.${cents.toString().padStart(2, "0")}`;
}

/**
 * UI ESTIMATE of the proposed 70/30 split (pending finance approval).
 * P1 = roundHalfUp(Q × 70 / 100), P2 = Q − P1. BigInt intermediate so Q × 70
 * never loses precision, even at Number.MAX_SAFE_INTEGER.
 */
export function estimateSplit(totalCentavos: Centavos): { p1: Centavos; p2: Centavos } {
  assertCentavos(totalCentavos);
  if (totalCentavos <= 0) throw new RangeError("Quote total must be positive");
  const q = BigInt(totalCentavos);
  const p1 = (q * 70n + 50n) / 100n;
  return { p1: Number(p1), p2: Number(q - p1) };
}

/**
 * UI ESTIMATE of net before approved adjustments. Gross and fee must be
 * nonnegative safe integers. Returns null when below-fee (finance review).
 */
export function estimateNet(grossCentavos: Centavos, feeCentavos: Centavos): Centavos | null {
  assertCentavos(grossCentavos);
  assertCentavos(feeCentavos);
  if (grossCentavos < 0) throw new RangeError("Gross must be nonnegative");
  if (feeCentavos < 0) throw new RangeError("Fee must be nonnegative");
  const net = grossCentavos - feeCentavos;
  return net < 0 ? null : net;
}

/** Parse a user-typed peso string ("10,000.50") into integer centavos without floats. */
export function parsePesoInput(input: string): Centavos | null {
  const cleaned = input.replace(/[₱,\s]/g, "");
  const m = /^(\d{1,16})(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!m) return null;
  const cents = (m[2] ?? "").padEnd(2, "0");
  const v = BigInt(m[1] ?? "0") * 100n + BigInt(cents);
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : null;
}

const manilaFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Render a UTC ISO timestamp in Asia/Manila with explicit timezone label. */
export function formatManila(isoUtc: string): string {
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) return "Invalid time";
  return `${manilaFmt.format(d)} PHT (Asia/Manila)`;
}
