import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead } from "@/lib/head";
import { useCommand, useOp } from "@/lib/session";
import { formatManila } from "@/lib/money";
import type { Notice, Page } from "@/lib/api/types";
import { Empty, ErrorState, Freshness, GuardedButton, Loading, PageHeader } from "@/components/portal/states";

export const Route = createFileRoute("/_portal/notifications")({
  head: () => pageHead("Notifications", "Your fleet's inbox for review updates, RFQs, funding and settlement events."),
  component: Notifications,
});

function Notifications() {
  const q = useOp<Page<Notice>>("notifications.list");
  const mark = useCommand("notifications.markRead", ["notifications.list"]);
  const unread = q.data?.items.filter((n) => !n.read) ?? [];
  return (
    <>
      <PageHeader title="Notifications" subtitle="Opening a notification reloads the real record — a notice alone never lets you act." actions={<GuardedButton op="notifications.markRead" variant="btn-outline" disabledReason={unread.length === 0 ? "Nothing unread." : undefined} onClick={() => mark.mutate({ payload: { ids: unread.map((n) => n.id) } })}>Mark all read</GuardedButton>} />
      {q.isLoading && <Loading />}
      {q.error && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
      {q.data && (
        <>
          <Freshness updatedAt={q.dataUpdatedAt} onRefresh={() => q.refetch()} fetching={q.isFetching} />
          {q.data.items.length === 0 ? <Empty>You're all caught up.</Empty> : (
            <ul className="mt-3 divide-y rounded-lg border bg-card">
              {q.data.items.map((n) => (
                <li key={n.id} className="flex items-center gap-3 p-4">
                  <span className={`size-2.5 rounded-full ${n.read ? "bg-border" : "bg-primary ring-2 ring-foreground"}`} aria-hidden />
                  <div className="flex-1">
                    <p className={n.read ? "" : "font-semibold"}>{n.title}<span className="sr-only">{n.read ? " (read)" : " (unread)"}</span></p>
                    <p className="text-xs text-muted-foreground">{n.type} · {formatManila(n.at)}</p>
                  </div>
                  <Link to={n.link} className="btn-outline" onClick={() => !n.read && mark.mutate({ payload: { ids: [n.id] } })}>Open</Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
