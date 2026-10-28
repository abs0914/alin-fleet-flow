import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { pageHead } from "@/lib/head";
import { useCommand, useIdentity, useOp } from "@/lib/session";
import { present } from "@/lib/permissions";
import { formatManila, formatPHP, parsePesoInput, estimateSplit } from "@/lib/money";
import type { Catalog, Page, Proposal, ProposalStatus, Rfq } from "@/lib/api/types";
import { Empty, ErrorState, Freshness, GuardedButton, Loading, PageHeader, StatusBadge } from "@/components/portal/states";

export const Route = createFileRoute("/_portal/rfqs")({
  head: () => pageHead("RFQs & Proposals", "Quote heavy-truck requests: reefers, boom trucks, containers and long-haul."),
  component: Rfqs,
});

const pTone: Record<ProposalStatus, "ok" | "warn" | "bad" | "info" | "muted"> = { draft: "muted", submitted: "info", withdrawn: "muted", expired: "bad", selected: "ok", not_selected: "warn" };

function Rfqs() {
  const q = useOp<Page<Rfq>>("rfq.list");
  const cat = useOp<Catalog>("catalog.get");
  const [sel, setSel] = useState<string | null>(null);
  const label = (id: string) => cat.data?.categories.find((c) => c.id === id)?.label ?? id;
  return (
    <>
      <PageHeader title="RFQs & Proposals" subtitle="Customers pick and confirm in the ALiN customer app. You quote; they decide." />
      {q.isLoading && <Loading />}
      {q.error && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
      {q.data && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-2">
            <Freshness updatedAt={q.dataUpdatedAt} onRefresh={() => q.refetch()} fetching={q.isFetching} />
            {q.data.items.length === 0 && <Empty>No eligible RFQs.</Empty>}
            {q.data.items.map((r) => (
              <button key={r.id} className={`card w-full text-left ${sel === r.id ? "border-foreground" : ""}`} onClick={() => setSel(r.id)} aria-pressed={sel === r.id}>
                <div className="flex justify-between gap-2"><p className="font-semibold">{label(r.categoryId)}</p><StatusBadge tone={r.status === "open" ? "info" : "muted"}>{r.status}</StatusBadge></div>
                <p className="text-sm">{r.pickup} → {r.dropoff}</p>
                <p className="text-xs text-muted-foreground">Expires {formatManila(r.expiresAt)}</p>
              </button>
            ))}
          </div>
          {(() => { const r = q.data.items.find((x) => x.id === sel); return r ? <RfqDetail r={r} catLabel={label(r.categoryId)} /> : <Empty>Pick an RFQ to see requirements and quote.</Empty>; })()}
        </div>
      )}
    </>
  );
}

function RfqDetail({ r, catLabel }: { r: Rfq; catLabel: string }) {
  const id = useIdentity();
  const submit = useCommand<Proposal>("proposal.submit", ["rfq.list"]);
  const withdraw = useCommand("proposal.withdraw", ["rfq.list"]);
  const perm = id.data ? present(id.data.role, "proposal.submit", { onboarding: id.data.fleet.onboarding }) : null;
  const [amount, setAmount] = useState("");
  const [inc, setInc] = useState("");
  const [exc, setExc] = useState("");
  const [validHours, setValidHours] = useState("24");
  const [err, setErr] = useState<string | null>(null);
  const cents = parsePesoInput(amount);
  const hasSelected = r.myProposals.some((p) => p.status === "selected");

  const send = (draft: boolean) => {
    if (cents === null || cents <= 0) return setErr("Enter a total like 35000 or 35,000.00.");
    const h = Number(validHours);
    if (!Number.isInteger(h) || h < 1 || h > 168) return setErr("Validity must be 1–168 hours.");
    if (!inc.trim()) return setErr("List at least one inclusion.");
    setErr(null);
    submit.mutate(
      { payload: { rfqId: r.id, requirementsVersion: r.requirementsVersion, totalCentavos: cents, inclusions: inc.split("\n").filter(Boolean), exclusions: exc.split("\n").filter(Boolean), availableFrom: r.windowStart, validUntil: new Date(Date.now() + h * 3600e3).toISOString(), draft } },
      { onSuccess: () => { toast.success(draft ? "Draft saved." : "Proposal sent. The customer decides in their app."); setAmount(""); }, onError: (e) => toast.error(e.message) },
    );
  };

  return (
    <section className="card space-y-4" aria-label={`RFQ ${r.id}`}>
      <div>
        <h2 className="font-display text-xl font-bold">{catLabel}: {r.pickup} → {r.dropoff}</h2>
        <p className="text-sm text-muted-foreground">{r.id} · requirements v{r.requirementsVersion}</p>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Pickup window</dt><dd>{formatManila(r.windowStart)} – {formatManila(r.windowEnd)}</dd></div>
        <div><dt className="text-muted-foreground">Cargo</dt><dd>{r.cargo.description} · {r.cargo.weightKg.toLocaleString()} kg · {r.cargo.l}×{r.cargo.w}×{r.cargo.h} cm</dd></div>
        <div><dt className="text-muted-foreground">Recipient requirements</dt><dd>{r.recipientRequirements}</dd></div>
        {r.temperatureC && <div><dt className="text-muted-foreground">Temperature</dt><dd>{r.temperatureC.min}°C to {r.temperatureC.max}°C</dd></div>}
        {r.liftingKg && <div><dt className="text-muted-foreground">Lifting</dt><dd>{r.liftingKg.toLocaleString()} kg</dd></div>}
        {r.container && <div><dt className="text-muted-foreground">Container</dt><dd>{r.container}</dd></div>}
      </dl>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Your proposals</h3>
        {r.myProposals.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
        <ul className="space-y-2">
          {r.myProposals.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
              <span>v{p.version} · <b>{formatPHP(p.totalCentavos)}</b> · valid to {formatManila(p.validUntil)}</span>
              <span className="flex items-center gap-2">
                <StatusBadge tone={pTone[p.status]}>{p.status.replace("_", " ")}</StatusBadge>
                {p.status === "submitted" && <GuardedButton op="proposal.withdraw" variant="btn-outline" onClick={() => withdraw.mutate({ payload: { id: p.id }, version: p.version })}>Withdraw</GuardedButton>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {r.status === "open" && !hasSelected && (
        <form className="space-y-3 rounded-md border p-4" onSubmit={(e) => { e.preventDefault(); send(false); }} noValidate>
          <h3 className="text-sm font-semibold">{r.myProposals.some((p) => p.status === "submitted") ? "Send a revised version" : "New proposal"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field"><span>Total amount (PHP)</span><input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="35,000.00" /></label>
            <label className="field"><span>Valid for (hours)</span><input className="input" type="number" min={1} max={168} value={validHours} onChange={(e) => setValidHours(e.target.value)} /></label>
            <label className="field"><span>Inclusions (one per line)</span><textarea className="input" value={inc} onChange={(e) => setInc(e.target.value)} /></label>
            <label className="field"><span>Exclusions (one per line)</span><textarea className="input" value={exc} onChange={(e) => setExc(e.target.value)} /></label>
          </div>
          {cents !== null && cents > 0 && (() => { const s = estimateSplit(cents); return <p className="text-xs text-muted-foreground">Estimate only: customer would be charged {formatPHP(s.p1)} at pickup and {formatPHP(s.p2)} on delivery. The platform fee comes off your settlement, not the customer's bill.</p>; })()}
          {err && <p role="alert" className="field-error">{err}</p>}
          <div className="flex flex-wrap gap-2">
            <GuardedButton op="proposal.submit" type="submit" disabledReason={perm && !perm.enabled ? perm.reason : undefined} pending={submit.isPending}>Submit proposal</GuardedButton>
            <GuardedButton op="proposal.submit" variant="btn-outline" disabledReason={perm && !perm.enabled ? perm.reason : undefined} onClick={() => send(true)}>Save draft</GuardedButton>
          </div>
        </form>
      )}
      {hasSelected && <p className="text-sm">The customer selected your proposal. It's locked — changes need a new version and customer acceptance.</p>}
    </section>
  );
}
