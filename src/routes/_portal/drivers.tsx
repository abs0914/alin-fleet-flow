import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { pageHead } from "@/lib/head";
import { useCommand, useIdentity, useOp } from "@/lib/session";
import { present } from "@/lib/permissions";
import { formatManila } from "@/lib/money";
import type { Driver, Page } from "@/lib/api/types";
import { Empty, ErrorState, GuardedButton, Loading, PageHeader, StatusBadge } from "@/components/portal/states";

export const Route = createFileRoute("/_portal/drivers")({
  head: () => pageHead("Drivers", "Invite drivers with existing ALiN accounts and manage fleet membership."),
  component: Drivers,
});

function Drivers() {
  const id = useIdentity();
  const q = useOp<Page<Driver>>("driver.list");
  const invite = useCommand<Driver>("driver.invite", ["driver.list"]);
  const revoke = useCommand<Driver>("membership.revoke", ["driver.list"]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Driver | null>(null);
  const perm = id.data ? present(id.data.role, "driver.invite", { onboarding: id.data.fleet.onboarding }) : null;

  return (
    <>
      <PageHeader title="Drivers" subtitle="Fleet drivers only see jobs you assign them. They never see public offers." />
      <form className="card mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate onSubmit={(e) => {
        e.preventDefault();
        if (name.trim().length < 2) return setErr("Enter the driver's name as on their ALiN account.");
        if (!/^\+?63\s?9\d{2}\s?\d{3}\s?\d{4}$/.test(phone.replace(/-/g, ""))) return setErr("Use the mobile number on their existing ALiN account.");
        setErr(null);
        invite.mutate({ payload: { name, phone } }, { onSuccess: () => { toast.success("Invite sent. They accept it in the ALiN driver app."); setName(""); setPhone(""); }, onError: (e) => toast.error(e.message) });
      }}>
        <label className="field"><span>Driver name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field"><span>ALiN account mobile</span><input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 917 123 4567" /></label>
        <GuardedButton op="driver.invite" type="submit" disabledReason={perm && !perm.enabled ? perm.reason : undefined} pending={invite.isPending}>Send invite</GuardedButton>
        {err && <p role="alert" className="field-error sm:col-span-3">{err}</p>}
      </form>

      {confirm && (
        <div role="alertdialog" aria-labelledby="rv-t" className="panel-error mb-6 flex-col">
          <p id="rv-t" className="font-semibold">Remove {confirm.name} from the fleet?</p>
          <p className="text-sm">Active assignments are handled by ALiN operations first. Removal doesn't make them an independent rider.</p>
          <div className="flex gap-2">
            <GuardedButton op="membership.revoke" variant="btn-danger" pending={revoke.isPending} onClick={() => revoke.mutate({ payload: { id: confirm.id }, version: confirm.version }, { onSuccess: () => { toast.success("Membership revoked."); setConfirm(null); }, onError: (e) => { toast.error(e.message); setConfirm(null); } })}>Remove</GuardedButton>
            <button className="btn-outline" onClick={() => setConfirm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {q.isLoading && <Loading />}
      {q.error && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
      {q.data && (q.data.items.length === 0 ? <Empty>No drivers yet. Invite your first one above.</Empty> : (
        <div className="card overflow-x-auto p-0">
          <table className="tbl">
            <thead><tr><th>Driver</th><th>Status</th><th>Membership</th><th>License valid to</th><th>Availability</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {q.data.items.map((d) => {
                const exp = new Date(d.licenseValidUntil).getTime() - Date.now() < 45 * 864e5;
                return (
                  <tr key={d.id}>
                    <td><p className="font-semibold">{d.name}</p><p className="text-xs text-muted-foreground">{d.phoneMasked}</p></td>
                    <td><StatusBadge tone={d.status === "approved" ? "ok" : d.status === "suspended" ? "bad" : "warn"}>{d.status}</StatusBadge></td>
                    <td><StatusBadge tone={d.membership === "managed_active" ? "ok" : d.membership === "revoked" ? "bad" : "muted"}>{d.membership.replace("_", " ")}</StatusBadge></td>
                    <td className="text-xs">{formatManila(d.licenseValidUntil)}{exp && <div><StatusBadge tone="warn">Expiring soon</StatusBadge></div>}</td>
                    <td><StatusBadge tone={d.availability === "available" ? "ok" : d.availability === "on_job" ? "info" : "muted"}>{d.availability.replace("_", " ")}</StatusBadge>{d.currentJobId && <p className="text-xs">Job {d.currentJobId}</p>}</td>
                    <td>{d.membership !== "revoked" && <button className="btn-ghost" disabled={!!perm && !perm.enabled} onClick={() => setConfirm(d)}>Remove</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
