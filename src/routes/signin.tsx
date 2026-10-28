import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FlaskConical, LockKeyhole } from "lucide-react";
import { useSession } from "@/lib/session";
import { Wordmark } from "./_portal";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in — ALiN Move Fleet Portal" },
      { name: "description", content: "Sign in to the ALiN Move Fleet Manager Portal with your existing ALiN account." },
      { property: "og:title", content: "Sign in — ALiN Move Fleet Portal" },
      { property: "og:description", content: "Fleet managers sign in with their existing ALiN account." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const { start } = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const configured = !!import.meta.env.VITE_ALIN_API_ORIGIN;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-secondary p-12 text-secondary-foreground lg:flex">
        <Wordmark className="h-14" />
        <div>
          <h1 className="font-display text-5xl font-extrabold leading-tight">
            Run your fleet.<br /><span className="text-primary">We'll handle the paperwork trail.</span>
          </h1>
          <p className="mt-4 max-w-md opacity-70">Accept jobs, quote heavy-truck RFQs, assign drivers and check settlements — all in one place.</p>
        </div>
        <p className="text-xs opacity-50">Status: DRAFT · Not production-certified</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden"><Wordmark /></div>
          <div>
            <h2 className="font-display text-2xl font-bold">Sign in</h2>
            <p className="text-sm text-muted-foreground">Use your existing ALiN Move account.</p>
          </div>
          <div className="card space-y-3">
            <div className="flex items-center gap-2 font-semibold"><LockKeyhole className="size-4" aria-hidden /> ALiN account</div>
            <p className="text-sm text-muted-foreground">
              {configured
                ? "API origin is configured, but the existing ALiN authentication integration hasn't been verified yet."
                : "The ALiN API origin and authentication aren't configured for this portal yet."}
            </p>
            <button
              className="btn-dark w-full"
              onClick={() => {
                setError("Integration required: sign-in with existing ALiN auth isn't connected. You can still look around — every screen will show what's missing.");
                start("production");
              }}
            >
              Continue with ALiN account
            </button>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {error && <button className="btn-outline w-full" onClick={() => navigate({ to: "/" })}>Open portal (not connected)</button>}
          </div>
          <div className="card space-y-3 border-2 border-dashed border-primary">
            <div className="flex items-center gap-2 font-semibold"><FlaskConical className="size-4" aria-hidden /> Demo — sample data</div>
            <p className="text-sm text-muted-foreground">Try the portal with in-memory sample records. Nothing is saved or sent anywhere, and balances and locations aren't real.</p>
            <button className="btn-primary w-full" onClick={() => { start("demo"); navigate({ to: "/" }); }}>
              Enter demo
            </button>
          </div>
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer">Session expired, forbidden or suspended?</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><b>Session expired:</b> you'll be returned here to sign in again; nothing is kept in the browser.</li>
              <li><b>Forbidden:</b> your account has no active fleet membership. Ask your fleet owner for an invite.</li>
              <li><b>Suspended fleet:</b> you can view records, but new jobs, proposals and assignments are blocked.</li>
            </ul>
          </details>
        </div>
      </section>
    </div>
  );
}
