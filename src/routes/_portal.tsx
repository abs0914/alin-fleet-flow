import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell, Briefcase, FileText, Gauge, LogOut, MapPin, Menu, Settings, Truck, Users, Wallet, X, ClipboardCheck,
} from "lucide-react";
import logo from "@/assets/alinmove_logo.png.asset.json";
import { useIdentity, useSession, useOp } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/permissions";
import { IntegrationRequiredError } from "@/lib/api/adapter";
import type { Notice, Page } from "@/lib/api/types";

export const Route = createFileRoute("/_portal")({ component: PortalLayout });

const NAV = [
  { to: "/", label: "Overview", icon: Gauge },
  { to: "/onboarding", label: "Onboarding", icon: ClipboardCheck },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/rfqs", label: "RFQs & Proposals", icon: FileText },
  { to: "/vehicles", label: "Fleet Vehicles", icon: Truck },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/tracking", label: "Tracking", icon: MapPin },
  { to: "/settlements", label: "Settlements", icon: Wallet },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Fleet Settings", icon: Settings },
] as const;

export function Wordmark({ className = "h-9" }: { className?: string }) {
  // Official ALiN Move logo; width auto keeps the 4034×1056 aspect ratio.
  return <img src={logo.url} alt="ALiN Move" width={4034} height={1056} className={`${className} w-auto max-w-full object-contain`} />;
}

function PortalLayout() {
  const { session, signOut } = useSession();
  const navigate = useNavigate();
  const id = useIdentity();
  const [open, setOpen] = useState(false);
  const notices = useOp<Page<Notice>>("notifications.list");
  const unread = notices.data?.items.filter((n) => !n.read).length ?? 0;

  useEffect(() => {
    if (!session) navigate({ to: "/signin" });
  }, [session, navigate]);
  if (!session) return null;

  const connection =
    session.mode === "demo"
      ? { label: "Demo — sample data", tone: "badge-warn" }
      : id.error instanceof IntegrationRequiredError
        ? { label: "Not connected — integration required", tone: "badge-bad" }
        : id.isSuccess
          ? { label: "Connected", tone: "badge-ok" }
          : { label: "Connecting…", tone: "badge-muted" };

  const nav = (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV.map((n) => (
        <Link key={n.to} to={n.to} className="nav-link" activeOptions={{ exact: n.to === "/" }} onClick={() => setOpen(false)}>
          <n.icon className="size-4" aria-hidden />
          {n.label}
          {n.to === "/notifications" && unread > 0 && (
            <span className="ml-auto rounded-full bg-primary px-1.5 text-xs text-primary-foreground" aria-label={`${unread} unread`}>{unread}</span>
          )}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {session.mode === "demo" && (
        <div className="demo-ribbon px-4 py-1.5 text-center text-xs font-bold uppercase tracking-wider" role="note">
          Demo — sample data · nothing is saved or sent · not real balances or live locations
        </div>
      )}
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 bg-sidebar p-4 text-sidebar-foreground lg:flex">
          <div className="text-sidebar-foreground"><Wordmark /><p className="mt-1 text-xs opacity-60">Fleet Manager · DRAFT</p></div>
          {nav}
        </aside>
        {open && (
          <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="w-72 bg-sidebar p-4 text-sidebar-foreground">
              <div className="mb-6 flex items-center justify-between">
                <Wordmark />
                <button className="btn-ghost text-sidebar-foreground" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
              </div>
              {nav}
            </div>
            <button className="flex-1 bg-foreground/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur lg:px-8">
            <button className="btn-ghost lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
            <span className="lg:hidden"><Wordmark className="h-7" /></span>
            <span className={`badge ${connection.tone} ml-auto lg:ml-0`} role="status">{connection.label}</span>
            <div className="ml-auto hidden items-center gap-3 text-right text-sm sm:flex">
              {id.data ? (
                <div>
                  <p className="font-semibold">{id.data.displayName}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABEL[id.data.role]} · {id.data.fleet.name}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Role and fleet unavailable</p>
              )}
            </div>
            <button className="btn-outline" onClick={() => { signOut(); navigate({ to: "/signin" }); }}>
              <LogOut className="size-4" aria-hidden /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
            <Outlet />
          </main>
          <footer className="px-8 pb-6 text-xs text-muted-foreground">
            Status: DRAFT · Times shown in Asia/Manila (PHT) ·{" "}
            <Link to="/dev/capabilities" className="underline">Developer integration matrix</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
