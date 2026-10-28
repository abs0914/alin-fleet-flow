import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/head";
import { locationLabel } from "@/lib/tracking";
import { useOp, useSession } from "@/lib/session";
import { formatManila } from "@/lib/money";
import type { Booking, Page, TrackingLatest } from "@/lib/api/types";
import { Empty, ErrorState, Freshness, Loading, PageHeader, StatusBadge } from "@/components/portal/states";

export const Route = createFileRoute("/_portal/tracking")({
  head: () => pageHead("Tracking", "Last known driver location for active fleet jobs, with stale and offline labels."),
  component: Tracking,
});

function Tracking() {
  const { session } = useSession();
  const q = useOp<TrackingLatest[]>("tracking.latest");
  const b = useOp<Page<Booking>>("booking.list");
  return (
    <>
      <PageHeader title="Tracking" subtitle="Last reported positions only. We never guess where a truck is." />
      <div className="panel-integration mb-4 text-sm">
        <p><b>Map not connected.</b> The existing ALiN mapping integration isn't verified, so positions are shown as a text timeline.{session?.mode === "demo" && " Demo coordinates are sample values, not live locations."}</p>
      </div>
      {q.isLoading && <Loading />}
      {q.error && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
      {q.data && (
        <>
          <Freshness updatedAt={q.dataUpdatedAt} onRefresh={() => q.refetch()} fetching={q.isFetching} />
          {q.data.length === 0 ? <Empty>No active authorized jobs to track.</Empty> : (
            <ul className="mt-3 space-y-3">
              {q.data.map((t) => {
                const s = locationLabel(t);
                const job = b.data?.items.find((x) => x.id === t.jobId);
                return (
                  <li key={t.jobId} className="card flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{job ? `${job.pickup} → ${job.dropoff}` : t.jobId}</p>
                      <p className="text-xs text-muted-foreground">Job {t.jobId}</p>
                    </div>
                    <div className="text-right text-sm">
                      <StatusBadge tone={s.tone}>{s.text}</StatusBadge>
                      {t.capturedAt && <p className="mt-1 text-xs">Captured {formatManila(t.capturedAt)} · ±{t.accuracyM} m</p>}
                      {t.lat !== null && <p className="font-mono text-xs">{t.lat.toFixed(3)}, {t.lng!.toFixed(3)}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}
