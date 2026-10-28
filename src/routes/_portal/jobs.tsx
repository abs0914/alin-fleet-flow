import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { pageHead } from "@/lib/head";
import { useCommand, useIdentity, useOp } from "@/lib/session";
import { present } from "@/lib/permissions";
import { estimateNet, estimateSplit, formatManila, formatPHP, CANCELLATION_HOLD_CENTAVOS } from "@/lib/money";
import type { Booking, Catalog, CaptureState, Driver, Page, StandardOffer, Vehicle } from "@/lib/api/types";
import { Empty, ErrorState, Freshness, GuardedButton, Loading, PageHeader, StatusBadge } from "@/components/portal/states";

export const Route = createFileRoute("/_portal/jobs")({
  head: () => pageHead("Jobs", "Standard job offers for your fleet, accepted bookings, assignment and dispatch status."),
  component: Jobs,
});

function useCats() {
  const c = useOp<Catalog>("catalog.get");
  return (id: string) => c.data?.categories.find((x) => x.id === id)?.label ?? id;
}

function Jobs() {
  const [tab, setTab] = useState<"offers" | "bookings">("offers");
  return (
    <>
      <PageHeader title="Jobs" subtitle="Grab standard jobs before they expire, then assign a driver and vehicle." />
      <div role="tablist" aria-label="Jobs" className="mb-4 flex gap-2">
        {(["offers", "bookings"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "btn-dark" : "btn-outline"} onClick={() => setTab(t)}>
            {t === "offers" ? "Offer queue" : "Fleet bookings"}
          </button>
        ))}
      </div>
      {tab === "offers" ? <Offers /> : <Bookings />}
    </>
  );
}

function Countdown({ iso }: { iso: string }) {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  return <StatusBadge tone={mins <= 5 ? "bad" : "warn"}>Expires in {mins} min</StatusBadge>;
}

function Offers() {
  const id = useIdentity();
  const q = useOp<Page<StandardOffer>>("standardOffer.list");
  const accept = useCommand<Booking>("standardOffer.accept", ["standardOffer.list", "booking.list"]);
  const cat = useCats();
  const perm = id.data ? present(id.data.role, "standardOffer.accept", { onboarding: id.data.fleet.onboarding }) : null;
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  return (
    <div className="space-y-3">
      <Freshness updatedAt={q.dataUpdatedAt} onRefresh={() => q.refetch()} fetching={q.isFetching} />
      {q.data!.items.length === 0 && <Empty>No open offers right now. We'll show new ones here.</Empty>}
      {q.data!.items.map((o) => (
        <article key={o.id} className="card flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold">{o.pickup} → {o.dropoff}</p>
            <p className="text-sm text-muted-foreground">{cat(o.categoryId)} · {o.weightKg.toLocaleString()} kg · Pickup {formatManila(o.pickupAt)}</p>
            <div className="mt-2"><Countdown iso={o.expiresAt} /></div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Canonical fare (backend)</p>
            <p className="font-display text-2xl font-extrabold">{formatPHP(o.fareCentavos)}</p>
            <GuardedButton
              op="standardOffer.accept"
              disabledReason={perm && !perm.enabled ? perm.reason : undefined}
              pending={accept.isPending && !!accept.variables?.payload && (accept.variables.payload as { id: string }).id === o.id}
              onClick={() =>
                accept.mutate(
                  { payload: { id: o.id }, version: o.version },
                  {
                    onSuccess: () => toast.success("Job accepted for your fleet. Now assign a driver."),
                    onError: (e: any) => toast.error(e.code === "JOB_UNAVAILABLE" ? "This job is no longer available." : e.message),
                  },
                )
              }
            >
              Accept for fleet
            </GuardedButton>
          </div>
        </article>
      ))}
      <p className="text-xs text-muted-foreground">Acceptance is revalidated by the server; only one fleet wins. Accepting doesn't assign a driver.</p>
    </div>
  );
}

const capTone = (c: CaptureState) => (c === "paid" ? "ok" : c === "failed" ? "bad" : c === "unknown" ? "warn" : c === "pending" ? "info" : "muted");

function Bookings() {
  const q = useOp<Page<Booking>>("booking.list");
  const [sel, setSel] = useState<string | null>(null);
  const cat = useCats();
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const b = q.data!.items.find((x) => x.id === sel);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <ul className="space-y-2">
        {q.data!.items.length === 0 && <Empty>No bookings yet.</Empty>}
        {q.data!.items.map((x) => (
          <li key={x.id}>
            <button className={`card w-full text-left ${sel === x.id ? "border-foreground" : ""}`} onClick={() => setSel(x.id)} aria-pressed={sel === x.id}>
              <p className="font-semibold">{x.pickup} → {x.dropoff}</p>
              <p className="text-sm text-muted-foreground">{x.id} · {cat(x.categoryId)} · {x.source.toUpperCase()}</p>
              <div className="mt-2"><StatusBadge tone="info">{x.state.replace(/_/g, " ")}</StatusBadge></div>
            </button>
          </li>
        ))}
      </ul>
      {b ? <BookingDetail b={b} /> : <Empty>Pick a booking to see details.</Empty>}
    </div>
  );
}

function BookingDetail({ b }: { b: Booking }) {
  const id = useIdentity();
  const vehicles = useOp<Page<Vehicle>>("vehicle.list");
  const drivers = useOp<Page<Driver>>("driver.list");
  const assign = useCommand<Booking>(b.assignment ? "assignment.replace" : "assignment.create", ["booking.list", "driver.list", "vehicle.list"]);
  const dispatch = useCommand("dispatch.authorize", ["booking.list"]);
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const perm = id.data ? present(id.data.role, "assignment.write", { onboarding: id.data.fleet.onboarding }) : null;
  const split = b.acceptedProposal ? estimateSplit(b.acceptedProposal.totalCentavos) : null;
  const net = estimateNet(b.grossCentavos, b.feeCentavos);
  const afterPickup = ["picked_up", "in_transit", "delivered"].includes(b.state);
  const okDrivers = drivers.data?.items.filter((d) => d.status === "approved" && d.availability === "available") ?? [];
  const okVehicles = vehicles.data?.items.filter((v) => v.approval === "approved" && v.availability === "available") ?? [];

  return (
    <section className="card space-y-5" aria-label={`Booking ${b.id}`}>
      <div>
        <h2 className="font-display text-xl font-bold">{b.pickup} → {b.dropoff}</h2>
        <p className="text-sm text-muted-foreground">Booking {b.id} · v{b.version}</p>
      </div>
      {b.acceptedProposal && (
        <div className="rounded-md bg-muted p-3 text-sm">
          <p className="font-semibold">Accepted proposal (locked)</p>
          <p>{b.acceptedProposal.id} v{b.acceptedProposal.version} · {formatPHP(b.acceptedProposal.totalCentavos)}</p>
        </div>
      )}
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div><p className="text-muted-foreground">Cancellation hold ({formatPHP(CANCELLATION_HOLD_CENTAVOS)}, separate)</p><StatusBadge tone={b.holdState === "active" ? "info" : b.holdState === "released" ? "ok" : b.holdState === "release_pending" ? "warn" : "muted"}>{b.holdState.replace("_", " ")}</StatusBadge></div>
        <div><p className="text-muted-foreground">Dispatch funding (70%)</p><StatusBadge tone={b.fundingVerified === "verified" ? "ok" : b.fundingVerified === "insufficient" ? "bad" : "muted"}>{b.fundingVerified}</StatusBadge></div>
        <div><p className="text-muted-foreground">Pickup capture{split ? ` (est. ${formatPHP(split.p1)})` : ""}</p><StatusBadge tone={capTone(b.pickupCapture)}>{b.pickupCapture.replace("_", " ")}</StatusBadge></div>
        <div><p className="text-muted-foreground">Final capture{split ? ` (est. ${formatPHP(split.p2)})` : ""}</p><StatusBadge tone={capTone(b.finalCapture)}>{b.finalCapture.replace("_", " ")}</StatusBadge></div>
        <div><p className="text-muted-foreground">Platform fee ({b.feeKind}, frozen by backend)</p><p className="font-semibold">{formatPHP(b.feeCentavos)}</p></div>
        <div><p className="text-muted-foreground">Estimated net settlement <span className="text-xs">(estimate only)</span></p><p className="font-semibold">{net === null ? "Finance review" : formatPHP(net)}</p></div>
      </div>
      <p className="text-xs text-muted-foreground">Payment statuses and physical pickup/delivery are tracked separately. A green indicator here never authorizes dispatch — only the backend does.</p>

      <fieldset className="space-y-3 rounded-md border p-4">
        <legend className="px-1 text-sm font-semibold">{b.assignment ? "Reassign" : "Assign"} driver & vehicle</legend>
        {afterPickup ? (
          <p className="text-sm">Already picked up. Reassignment needs the operations workflow — contact ALiN operations.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field"><span>Driver (approved & available)</span>
                <select className="input" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                  <option value="">Select driver…</option>
                  {okDrivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Vehicle (approved & available)</span>
                <select className="input" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  <option value="">Select vehicle…</option>
                  {okVehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}{v.pairedWith ? ` (paired ${v.pairedWith})` : ""}</option>)}
                </select>
              </label>
            </div>
            {b.assignment && <p className="text-xs text-muted-foreground">Reassigning revokes the current driver's access to this job.</p>}
            <GuardedButton
              op={b.assignment ? "assignment.replace" : "assignment.create"}
              disabledReason={perm && !perm.enabled ? perm.reason : !driverId || !vehicleId ? "Pick a driver and a vehicle." : undefined}
              pending={assign.isPending}
              onClick={() => assign.mutate({ payload: { jobId: b.id, driverId, vehicleId }, version: b.version }, { onSuccess: () => toast.success("Assignment saved by server."), onError: (e) => toast.error(e.message) })}
            >
              Save assignment
            </GuardedButton>
          </>
        )}
      </fieldset>

      <GuardedButton op="dispatch.authorize" variant="btn-dark" disabledReason={!b.assignment ? "Assign first." : undefined} pending={dispatch.isPending} onClick={() => dispatch.mutate({ payload: { jobId: b.id }, version: b.version }, { onError: (e) => toast.error(e.message) })}>
        Request dispatch authorization
      </GuardedButton>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Progress timeline (backend)</h3>
        <ol className="space-y-2 border-l-2 border-primary pl-4 text-sm">
          {b.timeline.map((t, i) => <li key={i}><p className="font-medium">{t.label}</p><p className="text-xs text-muted-foreground">{formatManila(t.at)}</p></li>)}
        </ol>
        {b.exceptions.length === 0 && <p className="mt-2 text-xs text-muted-foreground">No exceptions recorded.</p>}
      </div>
    </section>
  );
}
