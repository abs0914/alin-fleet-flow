import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { pageHead } from "@/lib/head";
import { useCommand, useIdentity, useOp } from "@/lib/session";
import type { Catalog } from "@/lib/api/types";
import { ErrorState, GuardedButton, Loading, PageHeader, StatusBadge } from "@/components/portal/states";

export const Route = createFileRoute("/_portal/onboarding")({
  head: () => pageHead("Fleet onboarding", "Submit your fleet's business details, service area and documents for ALiN review."),
  component: Onboarding,
});

const STEPS = ["Business & contact", "Service area", "Documents", "Review & submit"];
const STATUS_STEPS = ["draft", "submitted", "under_review", "approved"];

function Onboarding() {
  const id = useIdentity();
  const catalog = useOp<Catalog>("catalog.get");
  const submit = useCommand("fleet.submitOnboarding", ["fleet.get", "identity.getContext"]);
  const [step, setStep] = useState(0);
  const [biz, setBiz] = useState({ name: "", tin: "", contact: "", email: "", phone: "" });
  const [areas, setAreas] = useState("");
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const status = id.data?.fleet.onboarding;

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (biz.name.trim().length < 2) e["name"] = "Enter your registered business name.";
      if (!/^\d{3}-?\d{3}-?\d{3}(-?\d{3,5})?$/.test(biz.tin)) e["tin"] = "TIN looks like 123-456-789-000.";
      if (!biz.contact.trim()) e["contact"] = "Who should we call?";
      if (!/^\S+@\S+\.\S+$/.test(biz.email)) e["email"] = "Enter a valid email.";
      if (!/^\+?63\s?9\d{2}\s?\d{3}\s?\d{4}$/.test(biz.phone.replace(/-/g, ""))) e["phone"] = "Use a PH mobile, e.g. +63 917 123 4567.";
    }
    if (step === 1 && !areas.trim()) e["areas"] = "Add at least one service area.";
    if (step === 2) for (const c of catalog.data?.onboardingChecklist ?? []) if (c.required && !docs[c.type]) e[c.type] = "Required document.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const field = (k: keyof typeof biz, label: string, type = "text") => (
    <label className="field">
      <span>{label}</span>
      <input className="input" type={type} value={biz[k]} onChange={(ev) => setBiz({ ...biz, [k]: ev.target.value })} aria-invalid={!!errors[k]} aria-describedby={`${k}-err`} />
      {errors[k] && <span id={`${k}-err`} className="field-error">{errors[k]}</span>}
    </label>
  );

  return (
    <>
      <PageHeader title="Fleet onboarding" subtitle="Tell us about your business. ALiN operations reviews every fleet before you can take jobs." />
      {id.error && <ErrorState error={id.error} />}
      {status && (
        <div className="card mb-6">
          <p className="text-sm font-semibold">Approval status</p>
          <ol className="mt-3 flex flex-wrap gap-2" aria-label="Approval progress">
            {STATUS_STEPS.map((s) => (
              <li key={s}><StatusBadge tone={s === status ? "info" : STATUS_STEPS.indexOf(s) < STATUS_STEPS.indexOf(status) ? "ok" : "muted"}>{s.replace("_", " ")}</StatusBadge></li>
            ))}
            {["changes_requested", "rejected", "suspended"].includes(status) && <li><StatusBadge tone="bad">{status.replace("_", " ")}</StatusBadge></li>}
          </ol>
          {status === "changes_requested" && <p className="mt-2 text-sm">Operations asked for changes: {id.data?.fleet.reviewNote ?? "see notification"}. Update and resubmit below.</p>}
        </div>
      )}

      <ol className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Wizard steps">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={`rounded-md border px-3 py-2 text-sm ${i === step ? "border-foreground bg-primary font-semibold text-primary-foreground" : i < step ? "bg-muted" : ""}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <form className="card space-y-4" onSubmit={(e) => { e.preventDefault(); if (!validate()) return; if (step < 3) setStep(step + 1); }} noValidate>
        {step === 0 && <div className="grid gap-4 sm:grid-cols-2">{field("name", "Registered business name")}{field("tin", "TIN")}{field("contact", "Contact person")}{field("email", "Contact email", "email")}{field("phone", "Mobile number", "tel")}</div>}
        {step === 1 && (
          <label className="field">
            <span>Service areas (one per line)</span>
            <textarea className="input min-h-28" value={areas} onChange={(e) => setAreas(e.target.value)} placeholder={"Metro Manila\nCalabarzon"} aria-invalid={!!errors["areas"]} />
            {errors["areas"] && <span className="field-error">{errors["areas"]}</span>}
            <span className="text-xs text-muted-foreground">Serviceability is confirmed by the backend.</span>
          </label>
        )}
        {step === 2 && (
          <div className="space-y-3">
            {catalog.isLoading && <Loading label="Loading document checklist…" />}
            {catalog.error && <ErrorState error={catalog.error} />}
            {catalog.data?.onboardingChecklist.map((c) => (
              <label key={c.type} className="field">
                <span>{c.label}{c.required ? " *" : ""}</span>
                <input type="file" className="input" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setDocs({ ...docs, [c.type]: e.target.files?.[0]?.name ?? "" })} />
                {errors[c.type] && <span className="field-error">{errors[c.type]}</span>}
              </label>
            ))}
            <p className="text-xs text-muted-foreground">Files are uploaded privately through the backend's upload service. In demo mode only the filename is kept in memory.</p>
          </div>
        )}
        {step === 3 && (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {Object.entries(biz).map(([k, v]) => <div key={k}><dt className="text-muted-foreground capitalize">{k}</dt><dd className="font-medium">{v || "—"}</dd></div>)}
            <div><dt className="text-muted-foreground">Service areas</dt><dd className="font-medium">{areas.split("\n").filter(Boolean).join(", ")}</dd></div>
            <div><dt className="text-muted-foreground">Documents</dt><dd className="font-medium">{Object.values(docs).filter(Boolean).join(", ") || "—"}</dd></div>
          </dl>
        )}
        <div className="flex justify-between gap-2">
          <button type="button" className="btn-outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
          {step < 3 ? (
            <button type="submit" className="btn-dark">Next</button>
          ) : (
            <GuardedButton
              op={status === "changes_requested" ? "fleet.resubmit" : "fleet.submitOnboarding"}
              pending={submit.isPending}
              onClick={() => submit.mutate({ payload: { business: biz, areas: areas.split("\n").filter(Boolean), docs } }, { onSuccess: () => toast.success("Submitted for review."), onError: (e) => toast.error(e.message) })}
            >
              {status === "changes_requested" ? "Resubmit for review" : "Submit for review"}
            </GuardedButton>
          )}
        </div>
      </form>
    </>
  );
}
