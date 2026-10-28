/**
 * Logical operation → real route mapping. Status DRAFT.
 * No route below is verified. `route: null` means the operation is blocked in
 * production until the backend owner supplies a verified method/path, schema
 * and ownership checks. Never fill these in by guessing.
 */
export type OperationId =
  | "identity.getContext"
  | "fleet.get"
  | "fleet.submitOnboarding"
  | "fleet.resubmit"
  | "catalog.get"
  | "vehicle.list"
  | "vehicle.upsert"
  | "vehicle.availability"
  | "driver.list"
  | "driver.invite"
  | "driver.update"
  | "membership.revoke"
  | "standardOffer.list"
  | "standardOffer.accept"
  | "booking.list"
  | "rfq.list"
  | "rfq.detail"
  | "proposal.submit"
  | "proposal.revise"
  | "proposal.withdraw"
  | "assignment.create"
  | "assignment.replace"
  | "dispatch.authorize"
  | "tracking.latest"
  | "settlement.list"
  | "settlement.statement"
  | "settlement.payoutRequest"
  | "notifications.list"
  | "notifications.markRead"
  | "documents.uploadIntent"
  | "documents.finalize"
  | "documents.download";

export type VerificationStatus = "unverified" | "verified";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * A verified route binding. `pathTemplate` is origin-relative ("/x/:id"),
 * never absolute or network-path ("//host"). `:name` segments are filled from
 * request params; `query` is the allowlist of query keys the route accepts.
 */
export interface RouteBinding {
  method: HttpMethod;
  pathTemplate: string;
  query?: readonly string[];
}

export interface OperationMapping {
  id: OperationId;
  kind: "read" | "command";
  route: RouteBinding | null;
  status: VerificationStatus;
  note?: string;
}

const op = (id: OperationId, kind: "read" | "command", note?: string): OperationMapping => ({
  id,
  kind,
  route: null,
  status: "unverified",
  ...(note !== undefined ? { note } : {}),
});

export const OPERATIONS: OperationMapping[] = [
  op("identity.getContext", "read", "Historical GET /api/me documented, not live-verified; fleet fields unknown."),
  op("fleet.get", "read"),
  op("fleet.submitOnboarding", "command"),
  op("fleet.resubmit", "command"),
  op("catalog.get", "read", "Categories/checklists must come from backend catalog."),
  op("vehicle.list", "read"),
  op("vehicle.upsert", "command"),
  op("vehicle.availability", "command"),
  op("driver.list", "read"),
  op("driver.invite", "command"),
  op("driver.update", "command"),
  op("membership.revoke", "command", "Must revoke public offers atomically."),
  op("standardOffer.list", "read"),
  op("standardOffer.accept", "command", "Atomic winner; 409 JOB_UNAVAILABLE on conflict."),
  op("booking.list", "read", "Fleet-owned jobs incl. timeline/financial state."),
  op("rfq.list", "read"),
  op("rfq.detail", "read"),
  op("proposal.submit", "command"),
  op("proposal.revise", "command"),
  op("proposal.withdraw", "command"),
  op("assignment.create", "command"),
  op("assignment.replace", "command"),
  op("dispatch.authorize", "command", "Requires 70% funding policy approval."),
  op("tracking.latest", "read", "Mapping integration not verified."),
  op("settlement.list", "read"),
  op("settlement.statement", "read", "Server-generated statement only."),
  op("settlement.payoutRequest", "command", "Blocked: no approved payout policy."),
  op("notifications.list", "read"),
  op("notifications.markRead", "command"),
  op("documents.uploadIntent", "command"),
  op("documents.finalize", "command"),
  op("documents.download", "read"),
];

export function getMapping(id: OperationId): OperationMapping | undefined {
  return OPERATIONS.find((o) => o.id === id);
}
