import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useMemo } from "react";
import { pageHead } from "@/lib/head";
import { useIdentity, useOp, useSession } from "@/lib/session";
import { locationLabel } from "@/lib/tracking";
import { formatManila } from "@/lib/money";
import type { Booking, Page, Rfq, StandardOffer, TrackingLatest } from "@/lib/api/types";
import { Empty, ErrorState, Freshness, Loading, PageHeader, StatusBadge } from "@/components/portal/states";

const FleetMap = lazy(() => import("@/components/portal/FleetMap"));

export const Route = createFileRoute("/_portal/")({
  head: () => pageHead("Dashboard", "Fleet dashboard: open offers, RFQs, bookings and a live map of last reported driver positions."),
  component: Dashboard,
});

function Count({ label, q, to }: { label: string; q: { data?: { items: unknown[] } | undefined; error: unknown; isLoading: boolean }; to: string }) {
  return (
    <Link to={to} className="card block hover:border-foreground/40">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-4xl font-extrabold">
        {q.isLoading ? "…" : q.error ? "—" : q.data?.items.length}
      </p>
      {!!q.error && <p className="mt-1 text-xs text-muted-foreground">Integration required</p>}
    </Link>
  );
}

function Dashboard() {
  const { session } = useSession();
  const id = useIdentity();
  const offers = useOp<Page<StandardOffer>>("standardOffer.list");
  const rfqs = useOp<Page<Rfq>>("rfq.list");
  const bookings = useOp<Page<Booking>>("booking.list");
  const t = useOp<TrackingLatest[]>("tracking.latest");
  const labels = useMemo(() => {
    const m: Record<string, string> = {};
    for (const b of bookings.data?.items ?? []) m[b.id] = `${b.pickup} → ${b.dropoff}`;
    return m;
  }, [bookings.data]);

  return (
    <>
      <PageHeader title="Dashboard" subtitle={id.data ? `Hi, ${id.data.displayName.split(" ")[0]} — here's what needs you today. Counts come straight from the backend.` : "Here's what needs you today. Counts come straight from the backend."} />
      {id.isLoading && <Loading />}
      {id.error && <ErrorState error={id.error} />}
      {id.data && id.data.fleet.onboarding !== "approved" && (
        <div className="mb-6"><StatusBadge tone="warn">Fleet {id.data.fleet.onboarding.replace("_", " ")}</StatusBadge> <span className="text-sm">You can't accept jobs or propose until approved.</span></div>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Count label="Open standard offers" q={offers} to="/jobs" />
        <Count label="RFQs you can quote" q={rfqs} to="/rfqs" />
        <Count label="Fleet bookings" q={bookings} to="/jobs" />
      </div>

      <section id="tracking" className="mt-10" aria-labelledby="tracking-h">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="tracking-h" className="font-display text-2xl font-extrabold">Map & tracking</h2>
            <p className="text-sm text-muted-foreground">Last reported positions only. We never guess where a truck is.{session?.mode === "demo" && " Demo positions are sample values, not live locations."}</p>
          </div>
          {t.data && <Freshness updatedAt={t.dataUpdatedAt} onRefresh={() => t.refetch()} fetching={t.isFetching} />}
        </div>
        {t.isLoading && <Loading />}
        {t.error && <ErrorState error={t.error} onRetry={() => t.refetch()} />}
        {t.data && (
          <>
            <ClientOnly fallback={<div className="h-[420px] rounded-lg border bg-muted" />}>
              <Suspense fallback={<div className="h-[420px] rounded-lg border bg-muted" />}>
                <FleetMap points={t.data} labels={labels} />
              </Suspense>
            </ClientOnly>
            {t.data.length === 0 ? <div className="mt-3"><Empty>No active authorized jobs to track.</Empty></div> : (
              <ul className="mt-3 space-y-3">
                {t.data.map((p) => {
                  const s = locationLabel(p);
                  return (
                    <li key={p.jobId} className="card flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{labels[p.jobId] ?? p.jobId}</p>
                        <p className="text-xs text-muted-foreground">Job {p.jobId}</p>
                      </div>
                      <div className="text-right text-sm">
                        <StatusBadge tone={s.tone}>{s.text}</StatusBadge>
                        {p.capturedAt && <p className="mt-1 text-xs">Captured {formatManila(p.capturedAt)}{p.accuracyM !== null && ` · ±${p.accuracyM} m`}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </>
  );
}
