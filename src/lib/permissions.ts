/**
 * Permission PRESENTATION only. The backend enforces access; hiding a button is
 * never authorization. Role/permission names are proposed and must be mapped to
 * existing backend roles.
 */
export type FleetRole = "fleet_owner" | "fleet_dispatcher" | "fleet_viewer";

export type Permission =
  | "fleet.profile.edit"
  | "fleet.onboarding.submit"
  | "vehicle.write"
  | "driver.invite"
  | "standardOffer.accept"
  | "proposal.submit"
  | "assignment.write"
  | "dispatch.request"
  | "settlement.view"
  | "payout.request";

export type OnboardingStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "changes_requested"
  | "rejected"
  | "suspended";

const ROLE_GRANTS: Record<FleetRole, Permission[]> = {
  fleet_owner: [
    "fleet.profile.edit",
    "fleet.onboarding.submit",
    "vehicle.write",
    "driver.invite",
    "standardOffer.accept",
    "proposal.submit",
    "assignment.write",
    "dispatch.request",
    "settlement.view",
    // payout.request intentionally absent: no approved payout policy exists.
  ],
  fleet_dispatcher: ["standardOffer.accept", "proposal.submit", "assignment.write", "dispatch.request"],
  fleet_viewer: [],
};

export interface Presentation {
  visible: boolean;
  enabled: boolean;
  reason?: string;
}

const NEW_WORK: Permission[] = ["standardOffer.accept", "proposal.submit", "assignment.write", "dispatch.request"];

export function present(
  role: FleetRole,
  permission: Permission,
  opts: { onboarding: OnboardingStatus; extraGrants?: Permission[] },
): Presentation {
  if (permission === "payout.request") {
    return { visible: true, enabled: false, reason: "Payout requests are off until an approved payout policy exists." };
  }
  const granted = ROLE_GRANTS[role].includes(permission) || (opts.extraGrants ?? []).includes(permission);
  if (!granted) {
    if (permission === "settlement.view") return { visible: false, enabled: false, reason: "Needs an explicit financial grant." };
    return { visible: true, enabled: false, reason: "Your fleet role doesn't allow this." };
  }
  if (NEW_WORK.includes(permission) && opts.onboarding !== "approved") {
    return {
      visible: true,
      enabled: false,
      reason:
        opts.onboarding === "suspended"
          ? "Your fleet is suspended. New work is blocked."
          : "Your fleet isn't approved yet, so you can't accept jobs or send proposals.",
    };
  }
  return { visible: true, enabled: true };
}

export const ROLE_LABEL: Record<FleetRole, string> = {
  fleet_owner: "Fleet owner",
  fleet_dispatcher: "Fleet dispatcher",
  fleet_viewer: "Fleet viewer",
};
