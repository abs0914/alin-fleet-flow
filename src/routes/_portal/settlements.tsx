import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { pageHead } from "@/lib/head";
import { useCommand, useIdentity, useOp } from "@/lib/session";
import { present } from "@/lib/permissions";
import { formatPHP } from "@/lib/money";
import type { Page, Settlement } from "@/lib/api/types";
import { Empty, ErrorState, GuardedButton, Loading, PageHeader, StatusBadge } from "@/components/portal/states";

export const Route = createFileRoute("/_portal/settlements")({
  head: () => pageHead("Settlements", "Backend-calculated fleet settlements: gross, captured, platform fee and net payable."),
  component: Settlements,
});

function Settlements() {
  const id = useIdentity();
  const q = useOp<Page<Settlement>>("settlement.list");
  const statement = useCommand("settlement.statement", []);
  const view = id.data ? present(id.data.role, "settlement.view", { onboarding: id.data.fleet.onboarding, extraGrants: id.data.financialGrant ? ["settlement.view"] : [] }) : null;
  const payout = id.data ? present(id.data.role, "payout.request", { onboarding: id.data.fleet.onboarding }) : null;

  if (view && !view.visible) return <><PageHeader title="Settlements" /><Empty>You don't have financial access for this fleet. Ask your fleet owner for a financial grant.</Empty></>;

  return (
    <>
      <PageHeader title="Settlements" subtitle="Totals come from the ALiN backend. Your fleet receives the proceeds; the platform fee is deducted once." actions={<GuardedButton op="settlement.payoutRequest" disabledReason={payout?.reason ?? "Payout requests are off until an approved payout policy exists."}>Request payout</GuardedButton>} />
      <p className="mb-4 text-xs text-muted-foreground">Fleet proceeds are a separate fleet-finance settlement, not an AI Wallet balance. The AI Wallet is prepaid only — no cashout or transfers.</p>
      {q.isLoading && <Loading />}
      {q.error && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
      {q.data && (q.data.items.length === 0 ? <Empty>No settlements yet.</Empty> : (
        <div className="space-y-4">
          {q.data.items.map((s) => (
            <article key={s.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="font-semibold">Settlement {s.id}</p><p className="text-xs text-muted-foreground">Booking {s.bookingId}</p></div>
                <StatusBadge tone={s.state === "paid" ? "ok" : s.state === "blocked" || s.state === "failed" ? "bad" : s.state === "outcome_unknown" ? "warn" : "info"}>{s.state.replace("_", " ")}</StatusBadge>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div><dt className="text-muted-foreground">Earned gross</dt><dd className="font-semibold">{formatPHP(s.grossCentavos)}</dd></div>
                <div><dt className="text-muted-foreground">Captured so far</dt><dd className="font-semibold">{formatPHP(s.capturedCentavos)}</dd></div>
                <div><dt className="text-muted-foreground">Platform fee ({s.feeKind === "intro" ? "₱399 intro" : "₱1,000 regular"}, frozen)</dt><dd className="font-semibold">−{formatPHP(s.feeCentavos)}</dd></div>
                <div><dt className="text-muted-foreground">Approved adjustments</dt><dd className="font-semibold">{formatPHP(s.adjustmentsCentavos)}</dd></div>
                <div><dt className="text-muted-foreground">Disputed / blocked</dt><dd className="font-semibold">{formatPHP(s.disputedCentavos)}</dd></div>
                <div><dt className="text-muted-foreground">Net payable (backend)</dt><dd className="font-display text-xl font-extrabold">{s.netPayableCentavos === null ? "Pending review" : formatPHP(s.netPayableCentavos)}</dd></div>
              </dl>
              <p className="mt-3 rounded-md bg-muted p-2 text-xs">Cancellation hold: {s.holdNote}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs text-muted-foreground">Ledger refs: {s.ledgerRefs.join(", ")}</p>
                <GuardedButton op="settlement.statement" variant="btn-outline" pending={statement.isPending} onClick={() => statement.mutate({ payload: { id: s.id } }, { onError: (e) => toast.error(e.message) })}>Download statement</GuardedButton>
              </div>
            </article>
          ))}
        </div>
      ))}
    </>
  );
}
