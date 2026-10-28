import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { pageHead } from "@/lib/head";
import { useCommand, useIdentity, useOp } from "@/lib/session";
import { present } from "@/lib/permissions";
import { formatManila } from "@/lib/money";
import type { Catalog, Page, Vehicle } from "@/lib/api/types";
import { Empty, ErrorState, GuardedButton, Loading, PageHeader, StatusBadge } from "@/components/portal/states";

export const Route = createFileRoute("/_portal/vehicles")({
  head: () => pageHead("Fleet vehicles", "Register and manage trucks, reefers, trailers, tractor heads and boom trucks."),
  component: Vehicles,
});

type Form = { id?: string; plate: string; categoryId: string; capacityKg: string; l: string; w: string; h: string; reeferMin: string; reeferMax: string; lifting: string; coupling: "" | "tractor" | "trailer"; pairedWith: string; docsUntil: string };
const blank: Form = { plate: "", categoryId: "", capacityKg: "", l: "", w: "", h: "", reeferMin: "", reeferMax: "", lifting: "", coupling: "", pairedWith: "", docsUntil: "" };

function Vehicles() {
  const id = useIdentity();
  const q = useOp<Page<Vehicle>>("vehicle.list");
  const cat = useOp<Catalog>("catalog.get");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const perm = id.data ? present(id.data.role, "vehicle.write", { onboarding: id.data.fleet.onboarding }) : null;
  const label = (c: string) => cat.data?.categories.find((x) => x.id === c)?.label ?? c;
  const items = (q.data?.items ?? []).filter((v) => `${v.plate} ${label(v.categoryId)}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <PageHeader title="Fleet vehicles" subtitle="Expired documents and maintenance block a vehicle from new assignments." actions={<GuardedButton op="vehicle.upsert" disabledReason={perm && !perm.enabled ? perm.reason : undefined} onClick={() => setForm({ ...blank })}>Add vehicle</GuardedButton>} />
      <label className="field mb-4 max-w-sm"><span>Search</span><input className="input" type="search" placeholder="Plate or category" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      {form && <VehicleForm form={form} setForm={setForm} cat={cat.data} vehicles={q.data?.items ?? []} />}
      {q.isLoading && <Loading />}
      {q.error && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
      {q.data && (items.length === 0 ? <Empty>No vehicles match.</Empty> : (
        <div className="card overflow-x-auto p-0">
          <table className="tbl">
            <thead><tr><th>Plate</th><th>Category</th><th>Capacity</th><th>Specials</th><th>Docs valid to</th><th>Approval</th><th>Availability</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {items.map((v) => {
                const expired = new Date(v.documentsValidUntil).getTime() < Date.now();
                return (
                  <tr key={v.id}>
                    <td className="font-mono font-semibold">{v.plate}</td>
                    <td>{label(v.categoryId)}</td>
                    <td>{v.capacityKg ? `${v.capacityKg.toLocaleString()} kg` : "—"}<br /><span className="text-xs text-muted-foreground">{v.dimensionsCm.l}×{v.dimensionsCm.w}×{v.dimensionsCm.h} cm</span></td>
                    <td className="text-xs">
                      {v.reeferRangeC && <div>Reefer {v.reeferRangeC.min}°C…{v.reeferRangeC.max}°C</div>}
                      {v.liftingCapacityKg && <div>Lifts {v.liftingCapacityKg.toLocaleString()} kg</div>}
                      {v.coupling && <div className="capitalize">{v.coupling}{v.pairedWith ? ` · paired ${v.pairedWith} (shared lock)` : ""}</div>}
                    </td>
                    <td>{expired ? <StatusBadge tone="bad">Expired</StatusBadge> : <span className="text-xs">{formatManila(v.documentsValidUntil)}</span>}</td>
                    <td><StatusBadge tone={v.approval === "approved" ? "ok" : v.approval === "rejected" ? "bad" : "warn"}>{v.approval.replace("_", " ")}</StatusBadge></td>
                    <td><StatusBadge tone={v.availability === "available" ? "ok" : v.availability === "assigned" ? "info" : "bad"}>{v.availability}</StatusBadge>{v.blockReason && <p className="mt-1 text-xs text-muted-foreground">{v.blockReason}</p>}</td>
                    <td><button className="btn-ghost" disabled={!!perm && !perm.enabled} onClick={() => setForm({ id: v.id, plate: v.plate, categoryId: v.categoryId, capacityKg: String(v.capacityKg), l: String(v.dimensionsCm.l), w: String(v.dimensionsCm.w), h: String(v.dimensionsCm.h), reeferMin: String(v.reeferRangeC?.min ?? ""), reeferMax: String(v.reeferRangeC?.max ?? ""), lifting: String(v.liftingCapacityKg ?? ""), coupling: v.coupling ?? "", pairedWith: v.pairedWith ?? "", docsUntil: v.documentsValidUntil.slice(0, 10) })} aria-label={`Edit ${v.plate}`}>Edit</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      <p className="mt-3 text-xs text-muted-foreground">Taxonomy labels (10-wheeler, long-haul, reefer, trailer, tractor head, boom truck) are pending backend category mapping.</p>
    </>
  );
}

function VehicleForm({ form, setForm, cat, vehicles }: { form: Form; setForm: (f: Form | null) => void; cat?: Catalog; vehicles: Vehicle[] }) {
  const save = useCommand<Vehicle>("vehicle.upsert", ["vehicle.list"]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const c = cat?.categories.find((x) => x.id === form.categoryId);
  const isReefer = c?.taxonomy === "Reefer";
  const isBoom = c?.taxonomy === "Boom truck";
  const isCoupled = c?.taxonomy === "Tractor head" || c?.taxonomy === "Trailer";
  const counterparts = vehicles.filter((v) => v.coupling && v.coupling !== (c?.taxonomy === "Trailer" ? "trailer" : "tractor") && v.id !== form.id);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!/^[A-Z]{3}\s?\d{3,4}$/i.test(form.plate.trim())) e.plate = "Plate like ABC 1234.";
    if (!form.categoryId) e.categoryId = "Choose a category from the backend catalog.";
    for (const k of ["l", "w", "h"] as const) if (!(Number(form[k]) > 0)) e.dims = "Enter all dimensions in cm.";
    if (!isCoupled || c?.taxonomy === "Trailer") if (!(Number(form.capacityKg) > 0)) e.capacityKg = "Capacity must be above 0 kg.";
    if (isReefer && !(Number(form.reeferMin) < Number(form.reeferMax))) e.reefer = "Min temperature must be below max.";
    if (isBoom && !(Number(form.lifting) > 0)) e.lifting = "Enter lifting capacity.";
    if (!form.docsUntil) e.docsUntil = "Enter document validity date.";
    setErrors(e);
    if (Object.keys(e).length) return;
    save.mutate(
      { payload: { id: form.id, plate: form.plate.toUpperCase().trim(), categoryId: form.categoryId, capacityKg: Number(form.capacityKg) || 0, dimensionsCm: { l: +form.l, w: +form.w, h: +form.h }, reeferRangeC: isReefer ? { min: +form.reeferMin, max: +form.reeferMax } : undefined, liftingCapacityKg: isBoom ? +form.lifting : undefined, coupling: isCoupled ? (c?.taxonomy === "Trailer" ? "trailer" : "tractor") : undefined, pairedWith: form.pairedWith || undefined, documentsValidUntil: new Date(form.docsUntil + "T00:00:00+08:00").toISOString() } },
      { onSuccess: () => { toast.success("Saved. New vehicles wait for ALiN approval."); setForm(null); }, onError: (er) => toast.error(er.message) },
    );
  };
  const err = (k: string) => errors[k] && <span className="field-error">{errors[k]}</span>;

  return (
    <form className="card mb-6 space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate aria-label="Vehicle form">
      <h2 className="font-display text-lg font-bold">{form.id ? "Edit vehicle" : "Add vehicle"}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="field"><span>Plate number</span><input className="input" value={form.plate} onChange={set("plate")} />{err("plate")}</label>
        <label className="field"><span>Category</span>
          <select className="input" value={form.categoryId} onChange={set("categoryId")}>
            <option value="">Select…</option>
            {cat?.categories.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>{err("categoryId")}
        </label>
        <label className="field"><span>Capacity (kg)</span><input className="input" type="number" value={form.capacityKg} onChange={set("capacityKg")} />{err("capacityKg")}</label>
        <label className="field"><span>Length (cm)</span><input className="input" type="number" value={form.l} onChange={set("l")} /></label>
        <label className="field"><span>Width (cm)</span><input className="input" type="number" value={form.w} onChange={set("w")} /></label>
        <label className="field"><span>Height (cm)</span><input className="input" type="number" value={form.h} onChange={set("h")} />{err("dims")}</label>
        {isReefer && <>
          <label className="field"><span>Reefer min °C</span><input className="input" type="number" value={form.reeferMin} onChange={set("reeferMin")} /></label>
          <label className="field"><span>Reefer max °C</span><input className="input" type="number" value={form.reeferMax} onChange={set("reeferMax")} />{err("reefer")}</label>
        </>}
        {isBoom && <label className="field"><span>Lifting capacity (kg)</span><input className="input" type="number" value={form.lifting} onChange={set("lifting")} />{err("lifting")}</label>}
        {isCoupled && <label className="field"><span>Pair with compatible {c?.taxonomy === "Trailer" ? "tractor" : "trailer"}</span>
          <select className="input" value={form.pairedWith} onChange={set("pairedWith")}><option value="">Not paired</option>{counterparts.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}</select>
          <span className="text-xs text-muted-foreground">Paired units share one capacity lock.</span></label>}
        <label className="field"><span>Documents valid until</span><input className="input" type="date" value={form.docsUntil} onChange={set("docsUntil")} />{err("docsUntil")}</label>
      </div>
      <div className="flex gap-2">
        <GuardedButton op="vehicle.upsert" type="submit" pending={save.isPending}>Save vehicle</GuardedButton>
        <button type="button" className="btn-outline" onClick={() => setForm(null)}>Cancel</button>
      </div>
    </form>
  );
}
