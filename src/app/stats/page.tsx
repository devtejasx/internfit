"use client";

import { useState } from "react";
import type { Stats } from "@/lib/stats";

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 1000) / 10}%`);

export default function StatsPage() {
  const [key, setKey] = useState("");
  const [cohort, setCohort] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const qs = cohort ? `?cohort=${encodeURIComponent(cohort)}` : "";

  async function load(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stats${qs}`, { headers: { "x-stats-key": key } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setStats(data);
    } catch (err) {
      setError((err as Error).message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  async function downloadCsv() {
    const res = await fetch(`/api/stats${qs ? qs + "&" : "?"}format=csv`, { headers: { "x-stats-key": key } });
    if (!res.ok) return setError(`CSV export failed (HTTP ${res.status})`);
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement("a"), { href: url, download: "internfit-events.csv" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Experiment stats</h1>
      <p className="mt-1 text-sm text-muted">Anonymous event counts only. No student text is stored.</p>

      <form onSubmit={load} className="mt-5 flex flex-wrap items-end gap-3">
        <label className="text-sm text-ink">
          Stats key
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="mt-1 block w-56 rounded-xl border border-line bg-card p-2"
            autoComplete="off"
          />
        </label>
        <label className="text-sm text-ink">
          Cohort (optional)
          <input
            value={cohort}
            onChange={(e) => setCohort(e.target.value.toLowerCase())}
            placeholder="e.g. pilot1"
            className="mt-1 block w-40 rounded-xl border border-line bg-card p-2"
          />
        </label>
        <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-on-accent" disabled={!key || loading}>
          {loading ? "Loading…" : "Load"}
        </button>
        {stats && (
          <button type="button" onClick={downloadCsv} className="rounded-xl border border-line bg-card px-4 py-2 font-semibold text-ink">
            Download CSV
          </button>
        )}
      </form>
      {error && (
        <p role="alert" className="mt-4 text-sm text-bad">
          {error}
        </p>
      )}

      {stats && (
        <div className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Tile label="Task completion rate (primary)" value={pct(stats.primary.completionRate)} sub={`${stats.primary.copied} of ${stats.primary.started} sessions copied an output`} />
            <Tile label="Median time to first copy" value={stats.medianSecondsToFirstCopy === null ? "—" : `${Math.round(stats.medianSecondsToFirstCopy)} s`} />
            <Tile label="Error rate" value={pct(stats.errorRate)} sub={Object.entries(stats.errorsByCode).map(([k, v]) => `${k}: ${v}`).join(", ") || "no errors"} />
            <Tile label="Rated useful (4–5)" value={pct(stats.feedback.usefulShare)} sub={`${stats.feedback.responses} responses, mean ${stats.feedback.meanRating ?? "—"}`} />
            <Tile label="Would use for real" value={pct(stats.feedback.wouldUseYesShare)} />
            <Tile label="Median usual minutes (self-reported)" value={stats.feedback.medianUsualMinutes === null ? "—" : `${stats.feedback.medianUsualMinutes} min`} />
          </div>

          <Table title="Event totals (unique sessions)" rows={Object.entries(stats.totals).map(([k, v]) => [k, `${v} (${stats.uniqueSessions[k] ?? 0})`])} />
          <Table title="Fit bands returned" rows={Object.entries(stats.fitBands)} />
          <Table title="By day (sessions started / copied)" rows={Object.entries(stats.byDay).map(([d, v]) => [d, `${v.started} / ${v.copied}`])} />
          <p className="text-xs text-muted">
            Generated {new Date(stats.generatedAt).toLocaleString("en-IN")}. Median AI latency{" "}
            {stats.medianAnalysisLatencyMs === null ? "—" : `${(stats.medianAnalysisLatencyMs / 1000).toFixed(1)} s`}.
          </p>
        </div>
      )}
    </main>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function Table({ title, rows }: { title: string; rows: [string, string | number][] }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="mb-2 font-semibold text-ink">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No data yet.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-t border-line first:border-0">
                <td className="py-1.5 text-ink">{k}</td>
                <td className="py-1.5 text-right font-mono text-ink">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
