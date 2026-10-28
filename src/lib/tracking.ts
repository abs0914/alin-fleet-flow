import type { TrackingLatest } from "./api/types";

export const STALE_SECONDS = 120; // proposed threshold; backend-configurable

export function locationLabel(t: TrackingLatest, nowMs = Date.now()): { tone: "ok" | "warn" | "muted"; text: string } {
  if (!t.capturedAt || t.lat === null || t.lng === null) return { tone: "muted", text: "Location unavailable" };
  const age = (nowMs - new Date(t.capturedAt).getTime()) / 1000;
  return age > STALE_SECONDS ? { tone: "warn", text: `Stale — last update ${Math.round(age / 60)} min ago` } : { tone: "ok", text: "Recent" };
}

