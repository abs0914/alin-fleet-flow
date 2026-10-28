import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead } from "@/lib/head";
import { OPERATIONS } from "@/lib/api/operations";
import { createAdapter } from "@/lib/api/adapter";

export const Route = createFileRoute("/dev/capabilities")({
  head: () => pageHead("Developer integration matrix", "Which logical portal operations are live, unavailable or demo-only. Status DRAFT."),
  component: Matrix,
});

function Matrix() {
  const origin = import.meta.env.VITE_ALIN_API_ORIGIN as string | undefined;
  const prod = createAdapter({ mode: "production", apiOrigin: origin });
  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link to="/" className="text-sm underline">← Back to portal</Link>
      <h1 className="mt-4 font-display text-3xl font-extrabold">Integration capability matrix</h1>
      <p className="mt-1 text-sm text-muted-foreground">Status: <b>DRAFT</b>. For backend and mobile teams. API origin: <code className="font-mono">{origin ?? "not configured"}</code>. No route has been verified; production fails closed for every operation. Contract: docs/INTEGRATION-CONTRACT.md.</p>
      <div className="mt-6 overflow-x-auto rounded-lg border bg-card">
        <table className="tbl">
          <thead><tr><th>Operation</th><th>Kind</th><th>Real route</th><th>Production</th><th>Demo</th><th>Notes</th></tr></thead>
          <tbody>
            {OPERATIONS.map((o) => (
              <tr key={o.id}>
                <td className="font-mono text-xs">{o.id}</td>
                <td>{o.kind}</td>
                <td className="font-mono text-xs">{o.route ? `${o.route.method} ${o.route.path}` : "unmapped"}</td>
                <td><span className={`badge ${prod.isAvailable(o.id) ? "badge-ok" : "badge-bad"}`}>{prod.isAvailable(o.id) ? "✓ live" : "✕ unavailable"}</span></td>
                <td><span className="badge badge-warn">! demo fixture</span></td>
                <td className="text-xs text-muted-foreground">{o.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
