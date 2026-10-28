import { AlertTriangle, Loader2, PlugZap, RefreshCw } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { IntegrationRequiredError } from "@/lib/api/adapter";
import type { OperationId } from "@/lib/api/operations";
import { useAdapter } from "@/lib/session";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 p-6 text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden /> {label}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{children}</div>;
}

export function IntegrationRequired({ op }: { op: OperationId }) {
  return (
    <div role="alert" className="panel-integration">
      <PlugZap className="size-5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">Integration required</p>
        <p className="text-sm">
          <code className="font-mono">{op}</code> isn't connected to a verified ALiN backend route yet, so nothing is
          shown or sent. The backend team needs to supply the API origin, route schema and ownership checks.{" "}
          <Link to="/dev/capabilities" className="underline">
            See capability matrix
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (error instanceof IntegrationRequiredError) return <IntegrationRequired op={error.operation} />;
  const e = error as { code?: string; message?: string };
  return (
    <div role="alert" className="panel-error">
      <AlertTriangle className="size-5 shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="font-semibold">{e.code === "JOB_UNAVAILABLE" ? "Conflict" : "Something went wrong"}</p>
        <p className="text-sm">{e.message ?? "Request failed."}</p>
        {e.code && <p className="mt-1 font-mono text-xs opacity-70">Code: {e.code}</p>}
      </div>
      {onRetry && (
        <button className="btn-outline" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden /> Retry
        </button>
      )}
    </div>
  );
}

/** Renders an action button that is disabled with a stated reason when the op is unmapped or not permitted. */
export function GuardedButton({
  op,
  disabledReason,
  children,
  onClick,
  variant = "btn-primary",
  pending,
  type = "button",
}: {
  op: OperationId;
  disabledReason?: string;
  children: ReactNode;
  onClick?: () => void;
  variant?: string;
  pending?: boolean;
  type?: "button" | "submit";
}) {
  const adapter = useAdapter();
  const reason = !adapter.isAvailable(op) ? "Integration required" : disabledReason;
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type={type} className={variant} disabled={!!reason || pending} onClick={onClick} aria-describedby={reason ? `${op}-why` : undefined}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
      {reason && (
        <span id={`${op}-why`} className="text-xs text-muted-foreground">
          {reason}
        </span>
      )}
    </span>
  );
}

export function StatusBadge({ tone, children }: { tone: "ok" | "warn" | "bad" | "info" | "muted"; children: ReactNode }) {
  const sym = { ok: "✓", warn: "!", bad: "✕", info: "•", muted: "–" }[tone];
  return (
    <span className={`badge badge-${tone}`}>
      <span aria-hidden>{sym}</span> {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}

export function Freshness({ updatedAt, onRefresh, fetching }: { updatedAt: number; onRefresh: () => void; fetching: boolean }) {
  if (!updatedAt) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>
        Updated{" "}
        {new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(updatedAt)}{" "}
        PHT
      </span>
      <button className="btn-ghost" onClick={onRefresh} disabled={fetching} aria-label="Refresh data">
        <RefreshCw className={`size-3.5 ${fetching ? "animate-spin" : ""}`} aria-hidden />
      </button>
    </div>
  );
}
