import type { EventName, StoredEvent } from "./events";

export interface Stats {
  generatedAt: string;
  cohort: string | null;
  totals: Record<string, number>;
  uniqueSessions: Record<string, number>;
  primary: { started: number; copied: number; completionRate: number | null };
  analysisSuccessRate: number | null;
  errorRate: number | null;
  errorsByCode: Record<string, number>;
  fitBands: Record<string, number>;
  medianSecondsToFirstCopy: number | null;
  medianAnalysisLatencyMs: number | null;
  feedback: {
    responses: number;
    meanRating: number | null;
    usefulShare: number | null; // rating >= 4
    wouldUseYesShare: number | null;
    medianUsualMinutes: number | null;
  };
  byDay: Record<string, { started: number; copied: number }>;
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const ratio = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 1000 : null);

export function computeStats(all: StoredEvent[], cohort: string | null = null): Stats {
  const events = cohort ? all.filter((e) => e.meta.cohort === cohort) : all;
  const totals: Record<string, number> = {};
  const sessions = new Map<EventName, Set<string>>();
  for (const e of events) {
    totals[e.name] = (totals[e.name] ?? 0) + 1;
    if (!sessions.has(e.name)) sessions.set(e.name, new Set());
    sessions.get(e.name)!.add(e.sid);
  }
  const started = sessions.get("workflow_started") ?? new Set<string>();
  const copiedSids = new Set([...(sessions.get("output_copied") ?? [])].filter((s) => started.has(s)));

  const firstCopySec = new Map<string, number>();
  for (const e of events)
    if (e.name === "output_copied" && e.meta.elapsedSec && !firstCopySec.has(e.sid))
      firstCopySec.set(e.sid, Number(e.meta.elapsedSec));

  const errorsByCode: Record<string, number> = {};
  const fitBands: Record<string, number> = {};
  const latencies: number[] = [];
  for (const e of events) {
    if (e.name === "workflow_failed") errorsByCode[e.meta.errorCode ?? "unknown"] = (errorsByCode[e.meta.errorCode ?? "unknown"] ?? 0) + 1;
    if (e.name === "analysis_completed") {
      if (e.meta.fitBand) fitBands[e.meta.fitBand] = (fitBands[e.meta.fitBand] ?? 0) + 1;
      if (e.meta.latencyMs) latencies.push(Number(e.meta.latencyMs));
    }
  }

  // Last feedback per session wins.
  const fb = new Map<string, StoredEvent>();
  for (const e of events) if (e.name === "feedback_submitted") fb.set(e.sid, e);
  const fbs = [...fb.values()];
  const ratings = fbs.map((e) => Number(e.meta.rating)).filter((n) => n >= 1);
  const wouldUse = fbs.filter((e) => e.meta.wouldUse);

  const byDay: Stats["byDay"] = {};
  const seenStart = new Set<string>();
  const seenCopy = new Set<string>();
  for (const e of [...events].sort((a, b) => a.ts.localeCompare(b.ts))) {
    const d = e.ts.slice(0, 10);
    byDay[d] ??= { started: 0, copied: 0 };
    if (e.name === "workflow_started" && !seenStart.has(e.sid)) {
      seenStart.add(e.sid);
      byDay[d].started++;
    }
    if (e.name === "output_copied" && copiedSids.has(e.sid) && !seenCopy.has(e.sid)) {
      seenCopy.add(e.sid);
      byDay[d].copied++;
    }
  }

  const requested = totals.analysis_requested ?? 0;
  return {
    generatedAt: new Date().toISOString(),
    cohort,
    totals,
    uniqueSessions: Object.fromEntries([...sessions].map(([k, v]) => [k, v.size])),
    primary: { started: started.size, copied: copiedSids.size, completionRate: ratio(copiedSids.size, started.size) },
    analysisSuccessRate: ratio(totals.analysis_completed ?? 0, requested),
    errorRate: ratio(totals.workflow_failed ?? 0, requested),
    errorsByCode,
    fitBands,
    medianSecondsToFirstCopy: median([...firstCopySec].filter(([s]) => copiedSids.has(s)).map(([, v]) => v)),
    medianAnalysisLatencyMs: median(latencies),
    feedback: {
      responses: fbs.length,
      meanRating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100 : null,
      usefulShare: ratio(ratings.filter((r) => r >= 4).length, ratings.length),
      wouldUseYesShare: ratio(wouldUse.filter((e) => e.meta.wouldUse === "yes").length, wouldUse.length),
      medianUsualMinutes: median(fbs.map((e) => Number(e.meta.usualMinutes)).filter((n) => n > 0)),
    },
    byDay,
  };
}

export function eventsToCsv(events: StoredEvent[]): string {
  const keys = [...new Set(events.flatMap((e) => Object.keys(e.meta)))].sort();
  const rows = [["ts", "name", "sid", ...keys].join(",")];
  for (const e of [...events].sort((a, b) => a.ts.localeCompare(b.ts)))
    rows.push([e.ts, e.name, e.sid, ...keys.map((k) => e.meta[k] ?? "")].join(","));
  return rows.join("\n") + "\n";
}
