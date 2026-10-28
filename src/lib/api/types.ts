import type { Centavos } from "../money";
import type { FleetRole, OnboardingStatus } from "../permissions";

export type ISO = string; // UTC ISO-8601

export interface IdentityContext {
  userId: string;
  displayName: string;
  fleet: { id: string; name: string; onboarding: OnboardingStatus; reviewNote?: string };
  role: FleetRole;
  financialGrant: boolean;
}

export interface ChecklistItem {
  type: string;
  label: string;
  required: boolean;
}

export interface Catalog {
  categories: { id: string; label: string; heavy: boolean; taxonomy?: string }[];
  onboardingChecklist: ChecklistItem[];
  feePolicyVersion: string;
}

export type VehicleStatus = "pending_review" | "approved" | "rejected";
export type Availability = "available" | "assigned" | "maintenance" | "blocked";

export interface Vehicle {
  id: string;
  plate: string;
  categoryId: string;
  capacityKg: number;
  dimensionsCm: { l: number; w: number; h: number };
  reeferRangeC?: { min: number; max: number };
  liftingCapacityKg?: number;
  coupling?: "tractor" | "trailer";
  /** Container length option (tractor head/container/trailer only). Not a wheel count; no dimensions inferred. */
  containerLengthFt?: 20 | 40;
  pairedWith?: string;
  documentsValidUntil: ISO;
  approval: VehicleStatus;
  availability: Availability;
  blockReason?: string;
  currentJobId?: string;
  version: number;
}

export type DriverStatus = "invited" | "onboarding" | "approved" | "suspended";
export interface Driver {
  id: string;
  name: string;
  phoneMasked: string;
  status: DriverStatus;
  membership: "managed_active" | "pending" | "revoked";
  licenseValidUntil: ISO;
  availability: "available" | "on_job" | "off";
  currentJobId?: string;
  version: number;
}

export interface StandardOffer {
  id: string;
  pickup: string;
  dropoff: string;
  categoryId: string;
  weightKg: number;
  pickupAt: ISO;
  expiresAt: ISO;
  fareCentavos: Centavos;
  version: number;
}

export type ProposalStatus = "draft" | "submitted" | "withdrawn" | "expired" | "selected" | "not_selected";
export interface Proposal {
  id: string;
  rfqId: string;
  version: number;
  totalCentavos: Centavos;
  inclusions: string[];
  exclusions: string[];
  availableFrom: ISO;
  validUntil: ISO;
  status: ProposalStatus;
}

export interface Rfq {
  id: string;
  categoryId: string;
  pickup: string;
  dropoff: string;
  windowStart: ISO;
  windowEnd: ISO;
  expiresAt: ISO;
  cargo: { weightKg: number; l: number; w: number; h: number; description: string };
  recipientRequirements: string;
  temperatureC?: { min: number; max: number };
  liftingKg?: number;
  container?: string;
  /** Requested container length option, when the backend RFQ provides one. */
  containerLengthFt?: 20 | 40;
  requirementsVersion: number;
  status: "open" | "selected" | "expired" | "cancelled";
  myProposals: Proposal[];
}

export type ExecState =
  | "fleet_accepted"
  | "assignment_pending"
  | "assigned"
  | "dispatch_authorized"
  | "en_route_pickup"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed";
export type CaptureState = "not_started" | "pending" | "paid" | "failed" | "unknown";

export interface Booking {
  id: string;
  source: "standard" | "rfq";
  pickup: string;
  dropoff: string;
  categoryId: string;
  state: ExecState;
  acceptedProposal?: { id: string; version: number; totalCentavos: Centavos };
  weightKg: number;
  grossCentavos: Centavos;
  /** null = payment/fee terms for this source await backend confirmation. */
  feeCentavos: Centavos | null;
  feeKind: "intro" | "regular" | null;
  holdState: "none" | "active" | "released" | "release_pending";
  fundingVerified: "unknown" | "verified" | "insufficient";
  pickupCapture: CaptureState;
  finalCapture: CaptureState;
  assignment?: { driverId: string; vehicleId: string; version: number };
  timeline: { at: ISO; label: string }[];
  exceptions: { at: ISO; label: string }[];
  version: number;
}

export interface TrackingLatest {
  jobId: string;
  capturedAt: ISO | null;
  accuracyM: number | null;
  lat: number | null;
  lng: number | null;
}

export interface Settlement {
  id: string;
  bookingId: string;
  grossCentavos: Centavos;
  capturedCentavos: Centavos;
  feeCentavos: Centavos;
  feeKind: "intro" | "regular";
  adjustmentsCentavos: Centavos;
  netPayableCentavos: Centavos | null;
  disputedCentavos: Centavos;
  holdNote: string;
  state: "draft" | "blocked" | "eligible" | "approved" | "payout_pending" | "paid" | "failed" | "outcome_unknown";
  ledgerRefs: string[];
}

export interface Notice {
  id: string;
  type: string;
  title: string;
  at: ISO;
  read: boolean;
  link: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  serverTime: ISO;
}

export interface CommandMeta {
  idempotencyKey: string;
  expectedVersion?: number;
  correlationId: string;
}

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "VERSION_CONFLICT"
  | "JOB_UNAVAILABLE"
  | "QUOTE_EXPIRED"
  | "CAPACITY_CONFLICT"
  | "NOT_APPROVED"
  | "POLICY_UNRESOLVED"
  | "INTEGRATION_UNAVAILABLE";
