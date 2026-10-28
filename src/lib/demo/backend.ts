/**
 * DEMO — sample data. In-memory only: no persistence, no network, no real
 * balances, no live tracking. Resets on reload. Never used as a production fallback.
 */
import type { OperationId } from "../api/operations";
import type {
  Booking,
  Catalog,
  Driver,
  IdentityContext,
  Notice,
  Rfq,
  Settlement,
  StandardOffer,
  TrackingLatest,
  Vehicle,
  Proposal,
} from "../api/types";

const now = () => Date.now();
const iso = (offsetMin: number) => new Date(now() + offsetMin * 60_000).toISOString();

export class DemoError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface DemoState {
  identity: IdentityContext;
  catalog: Catalog;
  vehicles: Vehicle[];
  drivers: Driver[];
  offers: StandardOffer[];
  rfqs: Rfq[];
  bookings: Booking[];
  tracking: TrackingLatest[];
  settlements: Settlement[];
  notices: Notice[];
  onboarding: { business: Record<string, string>; areas: string[]; docs: Record<string, string> };
}

export function seed(): DemoState {
  return {
    identity: {
      userId: "demo-user-1",
      displayName: "Sample Manager",
      fleet: { id: "demo-fleet-a", name: "Sample Fleet A (Demo)", onboarding: "approved" },
      role: "fleet_owner",
      financialGrant: true,
    },
    catalog: {
      categories: [
        { id: "cat-van", label: "Closed van", heavy: false },
        { id: "cat-6w", label: "6-wheeler truck", heavy: false },
        { id: "cat-10w", label: "10-wheeler", heavy: true, taxonomy: "10-wheeler" },
        { id: "cat-reefer", label: "Reefer truck", heavy: true, taxonomy: "Reefer" },
        { id: "cat-tractor", label: "Tractor head / container", heavy: true, taxonomy: "Tractor head" },
        { id: "cat-trailer", label: "Trailer", heavy: true, taxonomy: "Trailer" },
        { id: "cat-boom", label: "Boom truck", heavy: true, taxonomy: "Boom truck" },
        { id: "cat-longhaul", label: "Long-haul", heavy: true, taxonomy: "Long-haul" },
      ],
      onboardingChecklist: [
        { type: "dti_sec", label: "DTI/SEC registration", required: true },
        { type: "bir_2303", label: "BIR Form 2303", required: true },
        { type: "mayor_permit", label: "Mayor's permit", required: true },
        { type: "insurance", label: "Cargo insurance (optional)", required: false },
      ],
      feePolicyVersion: "demo-fee-v1",
    },
    vehicles: [
      { id: "veh-1", plate: "NAB 1234", categoryId: "cat-10w", capacityKg: 12000, dimensionsCm: { l: 900, w: 240, h: 260 }, documentsValidUntil: iso(60 * 24 * 200), approval: "approved", availability: "available", version: 3 },
      { id: "veh-2", plate: "NCR 8821", categoryId: "cat-reefer", capacityKg: 8000, dimensionsCm: { l: 720, w: 230, h: 240 }, reeferRangeC: { min: -18, max: 4 }, documentsValidUntil: iso(-60 * 24 * 3), approval: "approved", availability: "blocked", blockReason: "Registration expired", version: 2 },
      { id: "veh-3", plate: "TRH 0042", categoryId: "cat-tractor", capacityKg: 0, dimensionsCm: { l: 650, w: 250, h: 380 }, coupling: "tractor", pairedWith: "veh-4", documentsValidUntil: iso(60 * 24 * 90), approval: "approved", availability: "available", version: 1 },
      { id: "veh-4", plate: "TRL 7710", categoryId: "cat-trailer", capacityKg: 30000, dimensionsCm: { l: 1220, w: 245, h: 260 }, coupling: "trailer", pairedWith: "veh-3", documentsValidUntil: iso(60 * 24 * 90), approval: "approved", availability: "available", version: 1 },
      { id: "veh-5", plate: "BMT 5050", categoryId: "cat-boom", capacityKg: 6000, dimensionsCm: { l: 800, w: 245, h: 300 }, liftingCapacityKg: 3000, documentsValidUntil: iso(60 * 24 * 60), approval: "pending_review", availability: "maintenance", blockReason: "Scheduled maintenance", version: 1 },
    ],
    drivers: [
      { id: "drv-1", name: "Sample Driver One", phoneMasked: "+63 9•• ••• 1201", status: "approved", membership: "managed_active", licenseValidUntil: iso(60 * 24 * 400), availability: "available", version: 2 },
      { id: "drv-2", name: "Sample Driver Two", phoneMasked: "+63 9•• ••• 4410", status: "approved", membership: "managed_active", licenseValidUntil: iso(60 * 24 * 30), availability: "on_job", currentJobId: "bk-1", version: 4 },
      { id: "drv-3", name: "Sample Invitee", phoneMasked: "+63 9•• ••• 9902", status: "invited", membership: "pending", licenseValidUntil: iso(60 * 24 * 300), availability: "off", version: 1 },
    ],
    offers: [
      { id: "off-1", pickup: "Pasig City", dropoff: "Calamba, Laguna", categoryId: "cat-6w", weightKg: 3500, pickupAt: iso(120), expiresAt: iso(9), fareCentavos: 850_000, version: 1 },
      { id: "off-2", pickup: "Valenzuela", dropoff: "Malolos, Bulacan", categoryId: "cat-van", weightKg: 900, pickupAt: iso(60), expiresAt: iso(4), fareCentavos: 320_050, version: 1 },
      { id: "off-3", pickup: "Taguig", dropoff: "Batangas Port", categoryId: "cat-6w", weightKg: 4200, pickupAt: iso(240), expiresAt: iso(15), fareCentavos: 1_250_000, version: 1 },
    ],
    rfqs: [
      { id: "rfq-1", categoryId: "cat-reefer", pickup: "Navotas Fish Port", dropoff: "Baguio City", windowStart: iso(60 * 20), windowEnd: iso(60 * 24), expiresAt: iso(60 * 6), cargo: { weightKg: 6000, l: 600, w: 220, h: 200, description: "Frozen seafood, palletized" }, recipientRequirements: "Cold-chain log on arrival", temperatureC: { min: -18, max: -12 }, requirementsVersion: 1, status: "open", myProposals: [] },
      { id: "rfq-2", categoryId: "cat-boom", pickup: "Cavite Ecozone", dropoff: "Sta. Rosa, Laguna", windowStart: iso(60 * 48), windowEnd: iso(60 * 52), expiresAt: iso(60 * 30), cargo: { weightKg: 2500, l: 400, w: 200, h: 180, description: "Industrial generator" }, recipientRequirements: "Site safety officer present", liftingKg: 2500, requirementsVersion: 2, status: "open", myProposals: [{ id: "prp-1", rfqId: "rfq-2", version: 1, totalCentavos: 3_500_000, inclusions: ["Boom operator", "Tolls"], exclusions: ["Permits"], availableFrom: iso(60 * 48), validUntil: iso(60 * 24), status: "submitted" }] },
      { id: "rfq-3", categoryId: "cat-tractor", pickup: "Manila North Harbor", dropoff: "Clark Freeport", windowStart: iso(-60 * 10), windowEnd: iso(-60 * 5), expiresAt: iso(-60 * 12), cargo: { weightKg: 22000, l: 1200, w: 240, h: 260, description: "40ft container" }, recipientRequirements: "Port release docs", container: "40ft HC", requirementsVersion: 1, status: "expired", myProposals: [{ id: "prp-2", rfqId: "rfq-3", version: 1, totalCentavos: 2_800_000, inclusions: ["Chassis"], exclusions: ["Demurrage"], availableFrom: iso(-60 * 10), validUntil: iso(-60 * 12), status: "expired" }] },
    ],
    bookings: [
      { id: "bk-1", source: "rfq", pickup: "Quezon City", dropoff: "San Fernando, Pampanga", categoryId: "cat-10w", state: "picked_up", acceptedProposal: { id: "prp-0", version: 2, totalCentavos: 1_000_000 }, grossCentavos: 1_000_000, feeCentavos: 39_900, feeKind: "intro", holdState: "active", fundingVerified: "verified", pickupCapture: "paid", finalCapture: "not_started", assignment: { driverId: "drv-2", vehicleId: "veh-1", version: 1 }, timeline: [{ at: iso(-300), label: "Customer confirmed proposal v2" }, { at: iso(-200), label: "Assigned to Sample Driver One" }, { at: iso(-90), label: "Dispatch authorized by backend" }, { at: iso(-30), label: "Pickup evidence recorded" }], exceptions: [], version: 6 },
      { id: "bk-2", source: "standard", pickup: "Makati", dropoff: "Antipolo", categoryId: "cat-6w", state: "assignment_pending", grossCentavos: 700_000, feeCentavos: 100_000, feeKind: "regular", holdState: "none", fundingVerified: "unknown", pickupCapture: "not_started", finalCapture: "not_started", timeline: [{ at: iso(-20), label: "Fleet accepted standard job" }], exceptions: [], version: 1 },
    ],
    tracking: [
      { jobId: "bk-1", capturedAt: iso(-6), accuracyM: 18, lat: 14.9, lng: 120.7 },
      { jobId: "bk-2", capturedAt: null, accuracyM: null, lat: null, lng: null },
    ],
    settlements: [
      { id: "stl-1", bookingId: "bk-0", grossCentavos: 1_000_000, capturedCentavos: 1_000_000, feeCentavos: 39_900, feeKind: "intro", adjustmentsCentavos: 0, netPayableCentavos: 960_100, disputedCentavos: 0, holdNote: "₱1,000.00 cancellation hold released to customer (not part of payable)", state: "eligible", ledgerRefs: ["DEMO-LDG-0001", "DEMO-LDG-0002"] },
      { id: "stl-2", bookingId: "bk-x", grossCentavos: 450_000, capturedCentavos: 315_000, feeCentavos: 100_000, feeKind: "regular", adjustmentsCentavos: 0, netPayableCentavos: null, disputedCentavos: 135_000, holdNote: "Final 30% payment due — settlement blocked", state: "blocked", ledgerRefs: ["DEMO-LDG-0007"] },
    ],
    notices: [
      { id: "n-1", type: "rfq.opened", title: "New reefer RFQ: Navotas → Baguio", at: iso(-15), read: false, link: "/rfqs" },
      { id: "n-2", type: "funds.verified", title: "Dispatch funding verified for bk-1", at: iso(-95), read: false, link: "/jobs" },
      { id: "n-3", type: "fleet.review_changed", title: "Fleet onboarding approved", at: iso(-60 * 24 * 5), read: true, link: "/onboarding" },
    ],
    onboarding: { business: { name: "Sample Fleet A", contact: "Sample Manager", email: "ops@example.test", phone: "+63 900 000 0000" }, areas: ["Metro Manila", "Central Luzon"], docs: {} },
  };
}

export interface DemoBackend {
  state: DemoState;
  handle(op: OperationId, payload?: unknown): Promise<unknown>;
}

const page = <T,>(items: T[]) => ({ items, nextCursor: null, serverTime: new Date().toISOString() });

export function createDemoBackend(initial: DemoState = seed()): DemoBackend {
  const s = initial;
  const handle = async (op: OperationId, payload?: unknown): Promise<unknown> => {
    await new Promise((r) => setTimeout(r, 150));
    const p = (payload ?? {}) as Record<string, any>;
    switch (op) {
      case "identity.getContext": return structuredClone(s.identity);
      case "catalog.get": return structuredClone(s.catalog);
      case "fleet.get": return structuredClone({ ...s.identity.fleet, ...s.onboarding });
      case "fleet.submitOnboarding":
      case "fleet.resubmit":
        s.onboarding = { ...s.onboarding, ...p };
        s.identity.fleet.onboarding = "submitted";
        return { status: "submitted" };
      case "vehicle.list": return page(structuredClone(s.vehicles));
      case "vehicle.upsert": {
        const v = p as Vehicle;
        if (s.vehicles.some((x) => x.plate === v.plate && x.id !== v.id)) throw new DemoError("VALIDATION_FAILED", "A vehicle with that plate already exists.");
        if (v.id) {
          const i = s.vehicles.findIndex((x) => x.id === v.id);
          s.vehicles[i] = { ...s.vehicles[i], ...v, version: s.vehicles[i].version + 1 };
          return s.vehicles[i];
        }
        const nv: Vehicle = { ...v, id: `veh-${s.vehicles.length + 1}-${Date.now() % 1000}`, approval: "pending_review", availability: "available", version: 1 };
        s.vehicles.push(nv);
        return nv;
      }
      case "driver.list": return page(structuredClone(s.drivers));
      case "driver.invite": {
        const d: Driver = { id: `drv-${Date.now() % 10000}`, name: p.name, phoneMasked: `+63 9•• ••• ${String(p.phone).slice(-4)}`, status: "invited", membership: "pending", licenseValidUntil: new Date(Date.now() + 365 * 864e5).toISOString(), availability: "off", version: 1 };
        s.drivers.push(d);
        return d;
      }
      case "driver.update":
      case "membership.revoke": {
        const d = s.drivers.find((x) => x.id === p.id);
        if (!d) throw new DemoError("FORBIDDEN", "Not found");
        if (d.currentJobId) throw new DemoError("POLICY_UNRESOLVED", "This driver has an active assignment. Operations must handle it first.");
        d.status = "suspended"; d.membership = "revoked"; d.version++;
        return d;
      }
      case "standardOffer.list": return page(structuredClone(s.offers.filter((o) => new Date(o.expiresAt).getTime() > Date.now())));
      case "standardOffer.accept": {
        const o = s.offers.find((x) => x.id === p.id);
        if (!o || p.id === "off-3") {
          s.offers = s.offers.filter((x) => x.id !== p.id);
          throw new DemoError("JOB_UNAVAILABLE", "This job is no longer available.");
        }
        s.offers = s.offers.filter((x) => x.id !== p.id);
        const b: Booking = { id: `bk-${Date.now() % 10000}`, source: "standard", pickup: o.pickup, dropoff: o.dropoff, categoryId: o.categoryId, state: "assignment_pending", grossCentavos: o.fareCentavos, feeCentavos: 100_000, feeKind: "regular", holdState: "none", fundingVerified: "unknown", pickupCapture: "not_started", finalCapture: "not_started", timeline: [{ at: new Date().toISOString(), label: "Fleet accepted standard job" }], exceptions: [], version: 1 };
        s.bookings.unshift(b);
        return b;
      }
      case "booking.list": return page(structuredClone(s.bookings));
      case "rfq.list": return page(structuredClone(s.rfqs));
      case "rfq.detail": return structuredClone(s.rfqs.find((r) => r.id === p.id));
      case "proposal.submit":
      case "proposal.revise": {
        const r = s.rfqs.find((x) => x.id === p.rfqId);
        if (!r || r.status !== "open") throw new DemoError("QUOTE_EXPIRED", "This RFQ is closed.");
        const prev = r.myProposals.filter((x) => x.status === "submitted");
        prev.forEach((x) => (x.status = "withdrawn"));
        const pr: Proposal = { id: `prp-${Date.now() % 10000}`, rfqId: r.id, version: (r.myProposals.at(-1)?.version ?? 0) + 1, totalCentavos: p.totalCentavos, inclusions: p.inclusions, exclusions: p.exclusions, availableFrom: p.availableFrom, validUntil: p.validUntil, status: p.draft ? "draft" : "submitted" };
        r.myProposals.push(pr);
        return pr;
      }
      case "proposal.withdraw": {
        for (const r of s.rfqs) for (const x of r.myProposals) if (x.id === p.id) x.status = "withdrawn";
        return { ok: true };
      }
      case "assignment.create":
      case "assignment.replace": {
        const b = s.bookings.find((x) => x.id === p.jobId)!;
        if (["picked_up", "in_transit", "delivered"].includes(b.state)) throw new DemoError("POLICY_UNRESOLVED", "After pickup, reassignment needs the operations workflow.");
        const v = s.vehicles.find((x) => x.id === p.vehicleId);
        const d = s.drivers.find((x) => x.id === p.driverId);
        if (!v || v.approval !== "approved" || v.availability !== "available") throw new DemoError("CAPACITY_CONFLICT", "That vehicle isn't approved and available.");
        if (!d || d.status !== "approved" || d.availability !== "available") throw new DemoError("CAPACITY_CONFLICT", "That driver isn't approved and available.");
        b.assignment = { driverId: d.id, vehicleId: v.id, version: (b.assignment?.version ?? 0) + 1 };
        b.state = "assigned"; b.version++;
        b.timeline.push({ at: new Date().toISOString(), label: `Assigned ${d.name} with ${v.plate}` });
        return b;
      }
      case "dispatch.authorize": throw new DemoError("POLICY_UNRESOLVED", "Dispatch stays blocked until the 70% funding policy is approved by finance.");
      case "tracking.latest": return structuredClone(s.tracking);
      case "settlement.list": return page(structuredClone(s.settlements));
      case "settlement.statement": throw new DemoError("INTEGRATION_UNAVAILABLE", "Statements are generated by the backend only. Not available in demo.");
      case "settlement.payoutRequest": throw new DemoError("POLICY_UNRESOLVED", "No approved payout policy.");
      case "notifications.list": return page(structuredClone(s.notices));
      case "notifications.markRead": s.notices.forEach((n) => { if ((p.ids as string[]).includes(n.id)) n.read = true; }); return { ok: true };
      default: throw new DemoError("INTEGRATION_UNAVAILABLE", `Not available in demo: ${op}`);
    }
  };
  return { state: s, handle };
}

export function bookingsOf(b: DemoBackend) { return b.state.bookings; }
