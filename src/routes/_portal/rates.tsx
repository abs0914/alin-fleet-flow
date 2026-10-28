import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { pageHead } from "@/lib/head";
import { formatPHP } from "@/lib/money";
import { PageHeader, StatusBadge } from "@/components/portal/states";
import {
  DESTINATIONS, RATE_ISSUES, RATE_MATRIX, UNCONFIRMED, canCiteAsReference, filterRows, issueFor, pesosToCentavos,
  type EquipmentLabel,
} from "@/lib/reference/rateMatrix";
import sourceImage from "@/assets/vutai-trucking-reference-2026.jpg.asset.json";

export const Route = createFileRoute("/_portal/rates")({
  head: () => pageHead("Rate Reference (DRAFT)", "Draft VUTAI 2026 bobtail rate matrix for 20FTR/40FTR container trucking — reference only, exclusive of VAT, unconfirmed."),
  component: RatesPage,
});

function RatesPage() {
  const [search, setSearch] = useState("");
  const [equipment, setEquipment] = useState<EquipmentLabel | "all">("all");
  const [destination, setDestination] = useState<string>("all");
  const [band, setBand] = useState<number | -1>(-1);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const rows = useMemo(() => filterRows({ search, equipment, destination, flaggedOnly }), [search, equipment, destination, flaggedOnly]);
  const bands = RATE_MATRIX.bandLabels.map((b, i) => ({ b, i })).filter(({ i }) => band === -1 || band === i);

  return (
    <div className="space-y-4">
      <PageHeader title="Rate Reference" subtitle="Read-only reference for quoting. It never changes a quote, fee, wallet, accepted quote or settlement." />

      <section className="card space-y-2 border-2 border-dashed" aria-label="Reference status">
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="warn">DRAFT REFERENCE</StatusBadge>
          <StatusBadge tone="muted">Source year {RATE_MATRIX.sourceYear}</StatusBadge>
          <StatusBadge tone="muted">Exclusive of VAT · tax rule unconfirmed</StatusBadge>
          <StatusBadge tone="bad">Unconfirmed — not approved ALiN pricing</StatusBadge>
        </div>
        <p className="text-sm font-semibold">{RATE_MATRIX.sourceTitle}</p>
        <p className="text-xs text-muted-foreground">
          Origin as printed: “{RATE_MATRIX.originLabel} TO”. Amounts are pesos as printed; row totals shown as-is with nothing added.
          Header prints 1,000 under each additional fuel surcharge column — how that relates to the totals is unconfirmed, and band units are not stated.
          South Harbor: printed “additional rate ₱{RATE_MATRIX.southHarborAdditionalPesos}” — reference note only, never applied automatically.
          In production the existing backend catalog is the pricing authority.
        </p>
        <button type="button" className="btn-outline" onClick={() => setShowSource((v) => !v)} aria-expanded={showSource}>
          {showSource ? "Hide source image" : "View source image"}
        </button>
        {showSource && (
          <figure className="space-y-1">
            <img src={sourceImage.url} alt="Source rate sheet: VUTAI local trucking bobtail (putol) rates 2026, exclusive of VAT" className="max-h-[80vh] w-auto max-w-full rounded-md border object-contain" />
            <figcaption className="text-xs text-muted-foreground">Supplied file {RATE_MATRIX.sourceFile}. Compare against the table below.</figcaption>
          </figure>
        )}
      </section>

      <section className="card grid gap-3 sm:grid-cols-5" aria-label="Filters">
        <label className="field sm:col-span-2"><span>Search destination</span><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. MEPZ" /></label>
        <label className="field"><span>Destination</span>
          <select className="input" value={destination} onChange={(e) => setDestination(e.target.value)}>
            <option value="all">All</option>{DESTINATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select></label>
        <label className="field"><span>Equipment (container length)</span>
          <select className="input" value={equipment} onChange={(e) => setEquipment(e.target.value as EquipmentLabel | "all")}>
            <option value="all">All</option><option value="20FTR">20FTR · 20 ft</option><option value="40FTR">40FTR · 40 ft</option>
          </select></label>
        <label className="field"><span>Band (as printed)</span>
          <select className="input" value={band} onChange={(e) => setBand(Number(e.target.value))}>
            <option value={-1}>All bands</option>{RATE_MATRIX.bandLabels.map((b, i) => <option key={b} value={i}>{b}</option>)}
          </select></label>
        <label className="flex items-center gap-2 text-sm sm:col-span-5"><input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} /> Show rows needing review only</label>
      </section>

      <section className="card overflow-x-auto" aria-label="Rate matrix">
        <table className="w-full text-sm">
          <thead><tr className="text-left">
            <th>{RATE_MATRIX.originLabel} to</th><th>Equipment</th>
            {bands.map(({ b }) => <th key={b} className="text-right">{b}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.destination}-${r.equipmentLabel}`}>
                <td className="font-semibold">{r.destination}{r.reviewRequired && <> <StatusBadge tone="warn">Review</StatusBadge></>}</td>
                <td>{r.equipmentLabel} <span className="text-xs text-muted-foreground">({r.containerLengthFt} ft)</span></td>
                {bands.map(({ i }) => {
                  const issue = issueFor(r, i);
                  return (
                    <td key={i} className="text-right tabular-nums" title={issue?.note}>
                      <span className={issue ? "font-semibold underline decoration-wavy" : ""}>{formatPHP(pesosToCentavos(r.amountsPesos[i] as number))}</span>
                      {!canCiteAsReference(r, i) && <div className="text-xs text-destructive">Flagged · not usable as reference</div>}
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="text-muted-foreground">No rows match.</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-2" aria-label="Transcription issues">
          <h2 className="font-display font-bold">Transcription issues (raw values kept)</h2>
          <ul className="space-y-1 text-sm">{RATE_ISSUES.map((i) => <li key={i.destination + i.band}><b>{i.destination} · {i.equipment} · {i.band}:</b> {formatPHP(pesosToCentavos(i.rawPesos))} — {i.note}</li>)}</ul>
        </div>
        <div className="card space-y-2" aria-label="Unconfirmed items">
          <h2 className="font-display font-bold">Awaiting confirmation</h2>
          <ul className="list-disc pl-5 text-sm">{UNCONFIRMED.map((u) => <li key={u}>{u}</li>)}</ul>
          <p className="text-xs text-muted-foreground">Covers 20FTR/40FTR container trucking only. It does not price reefer, boom truck, general 10-wheeler or long-haul jobs.</p>
        </div>
      </section>
    </div>
  );
}
