import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FlaskConical, LockKeyhole, LoaderCircle } from "lucide-react";
import { useSession } from "@/lib/session";
import { Wordmark } from "./_portal";
import { Button } from "@/components/ui/button";
import { LoginError } from "@/lib/api/auth";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in — ALiN Move Fleet Portal" },
      { name: "description", content: "Sign in to the ALiN Move Fleet Manager Portal with your existing ALiN account." },
      { property: "og:title", content: "Sign in — ALiN Move Fleet Portal" },
      { property: "og:description", content: "Fleet managers sign in with their existing ALiN account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const { start, signIn } = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

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
          <form className="card space-y-3" onSubmit={async (event) => {
            event.preventDefault();
            if (pending) return;
            setPending(true);
            setError(null);
            try {
              if (await signIn({ email, password })) await navigate({ to: "/" });
            } catch (e) {
              setError(e instanceof LoginError ? e.message : "Sign-in couldn't be completed. Please try again.");
            } finally {
              setPassword("");
              setPending(false);
            }
          }}>
            <div className="flex items-center gap-2 font-semibold"><LockKeyhole className="size-4" aria-hidden /> ALiN account</div>
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input id="email" name="email" type="email" autoComplete="username" required disabled={pending} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-foreground" />
            </div>
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required disabled={pending} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-foreground" />
            </div>
            <Button type="submit" variant="secondary" className="w-full" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden /> : <LockKeyhole aria-hidden />}
              {pending ? "Signing in…" : "Sign in with ALiN account"}
            </Button>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="button" variant="outline" className="w-full" disabled={pending} onClick={() => { start("production"); navigate({ to: "/" }); }}>Open portal (not connected)</Button>
          </form>
          <div className="card space-y-3 border-2 border-dashed border-primary">
            <div className="flex items-center gap-2 font-semibold"><FlaskConical className="size-4" aria-hidden /> Demo — sample data</div>
            <p className="text-sm text-muted-foreground">Try the portal with in-memory sample records. Nothing is saved or sent anywhere, and balances and locations aren't real.</p>
            <Button className="w-full" disabled={pending} onClick={() => { start("demo"); navigate({ to: "/" }); }}>
              Enter demo
            </Button>
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
