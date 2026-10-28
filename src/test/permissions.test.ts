import { describe, expect, it } from "vitest";
import { present } from "@/lib/permissions";
import { locationLabel } from "@/lib/tracking";

describe("permission presentation", () => {
  it("owner of approved fleet can accept jobs", () => {
    expect(present("fleet_owner", "standardOffer.accept", { onboarding: "approved" }).enabled).toBe(true);
  });
  it("pending fleet cannot accept jobs or propose", () => {
    for (const p of ["standardOffer.accept", "proposal.submit"] as const) {
      const r = present("fleet_owner", p, { onboarding: "submitted" });
      expect(r.enabled).toBe(false);
      expect(r.reason).toMatch(/isn't approved/);
    }
  });
  it("suspended fleet blocks assignment with a suspension reason", () => {
    expect(present("fleet_owner", "assignment.write", { onboarding: "suspended" }).reason).toMatch(/suspended/);
  });
  it("dispatcher cannot view settlements without explicit grant, can with one", () => {
    expect(present("fleet_dispatcher", "settlement.view", { onboarding: "approved" }).visible).toBe(false);
    expect(present("fleet_dispatcher", "settlement.view", { onboarding: "approved", extraGrants: ["settlement.view"] }).enabled).toBe(true);
  });
  it("viewer is read-only", () => {
    expect(present("fleet_viewer", "vehicle.write", { onboarding: "approved" }).enabled).toBe(false);
  });
  it("payout request is disabled for every role until a payout policy exists", () => {
    for (const role of ["fleet_owner", "fleet_dispatcher", "fleet_viewer"] as const) {
      expect(present(role, "payout.request", { onboarding: "approved" }).enabled).toBe(false);
    }
  });
});

describe("tracking labels", () => {
  const now = Date.parse("2026-01-01T00:10:00Z");
  it("missing coordinates show Location unavailable", () => {
    expect(locationLabel({ jobId: "j", capturedAt: null, accuracyM: null, lat: null, lng: null }, now).text).toBe("Location unavailable");
  });
  it("samples older than 120s are stale", () => {
    expect(locationLabel({ jobId: "j", capturedAt: "2026-01-01T00:07:00Z", accuracyM: 10, lat: 1, lng: 1 }, now).tone).toBe("warn");
    expect(locationLabel({ jobId: "j", capturedAt: "2026-01-01T00:09:00Z", accuracyM: 10, lat: 1, lng: 1 }, now).tone).toBe("ok");
  });
});
