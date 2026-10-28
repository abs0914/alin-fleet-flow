/**
 * DEMO-ONLY simulation tests. They check the in-memory sample backend so the
 * demo can't show double-booking or incompatible assignment. They do NOT test
 * or certify real backend enforcement (ASSET-01/02, DRIVER-04/05 remain pending).
 */
import { describe, expect, it } from "vitest";
import { createDemoBackend, seed } from "@/lib/demo/backend";
import type { Booking } from "@/lib/api/types";

const fresh = () => createDemoBackend(seed());
const assign = (d: ReturnType<typeof fresh>, jobId: string, driverId: string, vehicleId: string) =>
  d.handle("assignment.create", { jobId, driverId, vehicleId });

function addStandardJob(d: ReturnType<typeof fresh>, id: string, categoryId = "cat-6w", weightKg = 3000) {
  const b: Booking = { id, source: "standard", pickup: "Lapu-Lapu City", dropoff: "Cebu City", categoryId, weightKg, state: "assignment_pending", grossCentavos: 500_000, feeCentavos: null, feeKind: null, holdState: "none", fundingVerified: "unknown", pickupCapture: "not_started", finalCapture: "not_started", timeline: [], exceptions: [], version: 1 };
  d.state.bookings.push(b);
}

describe("demo assignment simulation", () => {
  it("seed is consistent: bk-1's vehicle and driver are occupied by bk-1", () => {
    const s = seed();
    expect(s.vehicles.find((v) => v.id === "veh-1")).toMatchObject({ availability: "assigned", currentJobId: "bk-1" });
    expect(s.drivers.find((x) => x.id === "drv-2")).toMatchObject({ availability: "on_job", currentJobId: "bk-1" });
    expect(s.bookings.find((b) => b.id === "bk-1")!.timeline.some((t) => t.label.includes("Sample Driver Two"))).toBe(true);
  });

  it("compatible assignment commits and occupies driver and vehicle", async () => {
    const d = fresh();
    const r = (await assign(d, "bk-2", "drv-1", "veh-6")) as Booking;
    expect(r.state).toBe("assigned");
    expect(r.assignment).toMatchObject({ driverId: "drv-1", vehicleId: "veh-6", version: 1 });
    expect(d.state.vehicles.find((v) => v.id === "veh-6")).toMatchObject({ availability: "assigned", currentJobId: "bk-2" });
    expect(d.state.drivers.find((x) => x.id === "drv-1")).toMatchObject({ availability: "on_job", currentJobId: "bk-2" });
  });

  it("rejects double assignment of the same driver or vehicle", async () => {
    const d = fresh();
    await assign(d, "bk-2", "drv-1", "veh-6");
    addStandardJob(d, "bk-9");
    await expect(assign(d, "bk-9", "drv-1", "veh-8")).rejects.toMatchObject({ code: "CAPACITY_CONFLICT" });
    await expect(assign(d, "bk-9", "drv-6", "veh-6")).rejects.toMatchObject({ code: "CAPACITY_CONFLICT" });
    expect(d.state.bookings.find((b) => b.id === "bk-9")!.assignment).toBeUndefined();
  });

  it("rejects incompatible category, expired docs/license, revoked membership and overweight", async () => {
    const d = fresh();
    await expect(assign(d, "bk-2", "drv-1", "veh-7")).rejects.toMatchObject({ message: expect.stringMatching(/category/) });
    await expect(assign(d, "bk-2", "drv-1", "veh-8")).rejects.toMatchObject({ message: expect.stringMatching(/expired documents/) });
    await expect(assign(d, "bk-2", "drv-4", "veh-6")).rejects.toMatchObject({ message: expect.stringMatching(/license has expired/) });
    await expect(assign(d, "bk-2", "drv-5", "veh-6")).rejects.toMatchObject({ message: expect.stringMatching(/no active fleet membership/) });
    addStandardJob(d, "bk-heavy", "cat-6w", 9000);
    await expect(assign(d, "bk-heavy", "drv-1", "veh-6")).rejects.toMatchObject({ message: expect.stringMatching(/can't carry/) });
    expect(d.state.vehicles.find((v) => v.id === "veh-6")!.availability).toBe("available");
  });

  it("reserves a paired tractor and trailer together and refuses the trailer alone", async () => {
    const d = fresh();
    addStandardJob(d, "bk-ctr", "cat-tractor", 20000);
    await expect(assign(d, "bk-ctr", "drv-1", "veh-4")).rejects.toMatchObject({ code: "CAPACITY_CONFLICT" });
    await assign(d, "bk-ctr", "drv-1", "veh-3");
    expect(d.state.vehicles.filter((v) => v.currentJobId === "bk-ctr").map((v) => v.id).sort()).toEqual(["veh-3", "veh-4"]);
  });

  it("pre-pickup replacement releases the old driver and vehicle", async () => {
    const d = fresh();
    await assign(d, "bk-2", "drv-1", "veh-6");
    const r = (await d.handle("assignment.replace", { jobId: "bk-2", driverId: "drv-6", vehicleId: "veh-6" })) as Booking;
    expect(r.assignment).toMatchObject({ driverId: "drv-6", version: 2 });
    expect(d.state.drivers.find((x) => x.id === "drv-1")).toMatchObject({ availability: "available" });
    expect(d.state.drivers.find((x) => x.id === "drv-1")!.currentJobId).toBeUndefined();
    expect(d.state.vehicles.find((v) => v.id === "veh-6")).toMatchObject({ currentJobId: "bk-2" });
  });

  it("refuses reassignment after pickup", async () => {
    await expect(assign(fresh(), "bk-1", "drv-1", "veh-1")).rejects.toMatchObject({ code: "POLICY_UNRESOLVED" });
  });

  it("proposal form payload commits a submitted version with integer total", async () => {
    const d = fresh();
    await d.handle("proposal.submit", { rfqId: "rfq-1", totalCentavos: 4_500_050, inclusions: ["Reefer unit"], exclusions: [], availableFrom: "2026-11-01T00:00:00Z", validUntil: "2026-11-02T00:00:00Z" });
    expect(d.state.rfqs.find((r) => r.id === "rfq-1")!.myProposals).toEqual([expect.objectContaining({ version: 1, totalCentavos: 4_500_050, status: "submitted" })]);
  });

  it("vehicle form payload commits a pending-review vehicle and rejects duplicate plate", async () => {
    const d = fresh();
    const v = { plate: "RFR 9090", categoryId: "cat-reefer", capacityKg: 7000, dimensionsCm: { l: 700, w: 230, h: 240 }, reeferRangeC: { min: -20, max: 5 }, documentsValidUntil: "2027-12-30T16:00:00.000Z" };
    await d.handle("vehicle.upsert", v);
    expect(d.state.vehicles.find((x) => x.plate === "RFR 9090")).toMatchObject({ approval: "pending_review", reeferRangeC: { min: -20, max: 5 } });
    await expect(d.handle("vehicle.upsert", v)).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });
});
