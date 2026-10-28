import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead } from "@/lib/head";
import { useIdentity, useOp } from "@/lib/session";
import type { Booking, Page, Rfq, StandardOffer } from "@/lib/api/types";
import { ErrorState, Loading, PageHeader, StatusBadge } from "@/components/portal/states";

export const Route = createFileRoute("/_portal/")({
  head: () => pageHead("Overview", "Today's fleet work at a glance: open offers, RFQs and active bookings."),
  component: Overview,
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

function Overview() {
  const id = useIdentity();
  const offers = useOp<Page<StandardOffer>>("standardOffer.list");
  const rfqs = useOp<Page<Rfq>>("rfq.list");
  const bookings = useOp<Page<Booking>>("booking.list");
  return (
    <>
      <PageHeader title={id.data ? `Hi, ${id.data.displayName.split(" ")[0]}` : "Overview"} subtitle="Here's what needs you today. Counts come straight from the backend — no invented stats." />
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
    </>
  );
}
