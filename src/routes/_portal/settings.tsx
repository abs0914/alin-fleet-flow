import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { pageHead } from "@/lib/head";
import { useIdentity } from "@/lib/session";
import { present, ROLE_LABEL, type Permission } from "@/lib/permissions";
import { ErrorState, GuardedButton, Loading, PageHeader, StatusBadge } from "@/components/portal/states";

export const Route = createFileRoute("/_portal/settings")({
  head: () => pageHead("Fleet settings", "Business contact details and what your role can do in this fleet."),
  component: Settings,
});

const PERMS: { p: Permission; label: string }[] = [
  { p: "fleet.profile.edit", label: "Edit fleet contact details" },
  { p: "vehicle.write", label: "Add or edit vehicles" },
  { p: "driver.invite", label: "Invite and remove drivers" },
  { p: "standardOffer.accept", label: "Accept standard jobs" },
  { p: "proposal.submit", label: "Send RFQ proposals" },
  { p: "assignment.write", label: "Assign drivers and vehicles" },
  { p: "settlement.view", label: "View settlements" },
  { p: "payout.request", label: "Request payouts" },
];

function Settings() {
  const id = useIdentity();
  const [contact, setContact] = useState({ email: "", phone: "" });
  if (id.isLoading) return <Loading />;
  return (
    <>
      <PageHeader title="Fleet settings" subtitle="Only a few contact details can be edited here. Business identity changes go through ALiN review." />
      {id.error && <ErrorState error={id.error} />}
      {id.data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form className="card space-y-3" onSubmit={(e) => e.preventDefault()}>
            <h2 className="font-semibold">Contact details</h2>
            <p className="text-sm text-muted-foreground">Fleet: {id.data.fleet.name}</p>
            <label className="field"><span>Operations email</span><input className="input" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></label>
            <label className="field"><span>Operations mobile</span><input className="input" type="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></label>
            <GuardedButton op="fleet.resubmit" disabledReason="Contact update operation isn't defined in the contract yet.">Save contact details</GuardedButton>
          </form>
          <section className="card">
            <h2 className="font-semibold">Your access</h2>
            <p className="text-sm text-muted-foreground">Role from backend: <b>{ROLE_LABEL[id.data.role]}</b>. The server enforces these — this list just explains them.</p>
            <ul className="mt-3 space-y-2 text-sm">
              {PERMS.map(({ p, label }) => {
                const r = present(id.data!.role, p, { onboarding: id.data!.fleet.onboarding, extraGrants: id.data!.financialGrant ? ["settlement.view"] : [] });
                return (
                  <li key={p} className="flex items-start justify-between gap-3">
                    <span>{label}{r.reason && <span className="block text-xs text-muted-foreground">{r.reason}</span>}</span>
                    <StatusBadge tone={r.enabled ? "ok" : "muted"}>{r.enabled ? "Allowed" : "Not allowed"}</StatusBadge>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
      <p className="mt-8 text-xs text-muted-foreground">For developers: <Link to="/dev/capabilities" className="underline">integration capability matrix</Link>.</p>
    </>
  );
}
