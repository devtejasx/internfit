// Minimal, privacy-conscious experiment analytics.
//
// An event is: name, random anonymous session id, timestamp, and a few coarse,
// whitelisted fields. Never resume text, job text, names, contacts or IPs.
//
// Storage: Vercel Blob when BLOB_READ_WRITE_TOKEN is set (the whole event is
// encoded in the blob pathname so stats need only list(), not N downloads),
// otherwise a local JSONL file for development.

import { promises as fs } from "node:fs";
import path from "node:path";

export const EVENT_NAMES = [
  "workflow_started",
  "analysis_requested",
  "analysis_completed",
  "workflow_failed",
  "output_copied",
  "output_edited",
  "feedback_submitted",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

// Allowed metadata keys and how to sanitise each value.
const META: Record<string, (v: unknown) => string | undefined> = {
  fitBand: (v) => (typeof v === "string" && /^(Strong|Moderate|Stretch|Weak)$/.test(v) ? v : undefined),
  errorCode: (v) => (typeof v === "string" && /^[a-z_]{1,24}$/.test(v) ? v : undefined),
  section: (v) => (typeof v === "string" && /^[a-z_]{1,24}$/.test(v) ? v : undefined),
  latencyMs: (v) => (typeof v === "number" && v >= 0 && v < 600_000 ? String(Math.round(v)) : undefined),
  elapsedSec: (v) => (typeof v === "number" && v >= 0 && v < 86_400 ? String(Math.round(v)) : undefined),
  rating: (v) => (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5 ? String(v) : undefined),
  wouldUse: (v) => (v === "yes" || v === "no" || v === "maybe" ? v : undefined),
  usualMinutes: (v) => (typeof v === "number" && v >= 0 && v <= 600 ? String(Math.round(v)) : undefined),
  cohort: (v) => (typeof v === "string" && /^[a-z0-9-]{1,24}$/.test(v) ? v : undefined),
};

export interface StoredEvent {
  name: EventName;
  sid: string;
  ts: string;
  meta: Record<string, string>;
}

export function sanitizeEvent(input: unknown, now = new Date()): StoredEvent | null {
  if (typeof input !== "object" || input === null) return null;
  const { name, sid, meta } = input as Record<string, unknown>;
  if (!EVENT_NAMES.includes(name as EventName)) return null;
  if (typeof sid !== "string" || !/^[a-z0-9]{8,32}$/.test(sid)) return null;
  const clean: Record<string, string> = {};
  if (typeof meta === "object" && meta !== null) {
    for (const [k, v] of Object.entries(meta)) {
      const s = META[k]?.(v);
      if (s !== undefined) clean[k] = s;
    }
  }
  return { name: name as EventName, sid, ts: now.toISOString(), meta: clean };
}

const LOCAL_FILE = path.join(process.cwd(), ".data", "events.jsonl");
const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;

// Meta is encoded as "key-value" pairs joined by "."; sanitised values never
// contain "." and keys never contain "-", so the format is unambiguous and
// needs no percent-encoding in the blob pathname.
function toPathname(e: StoredEvent): string {
  const meta = Object.entries(e.meta)
    .map(([k, v]) => `${k}-${v}`)
    .join(".");
  return `events/${e.ts.slice(0, 10)}/${e.name}/${e.ts.replace(/[:.]/g, "-")}~${e.sid}~${meta || "none"}.txt`;
}

function fromPathname(p: string): StoredEvent | null {
  const m = /^events\/\d{4}-\d{2}-\d{2}\/([a-z_]+)\/([^~/]+)~([a-z0-9]+)~([^~/]*)\.txt$/.exec(p);
  if (!m || !EVENT_NAMES.includes(m[1] as EventName)) return null;
  const ts = m[2].replace(/^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, "$1:$2:$3.$4Z");
  const meta: Record<string, string> = {};
  if (m[4] !== "none")
    for (const pair of m[4].split(".")) {
      const i = pair.indexOf("-");
      if (i > 0) meta[pair.slice(0, i)] = pair.slice(i + 1);
    }
  return { name: m[1] as EventName, sid: m[3], ts, meta };
}

export async function recordEvent(e: StoredEvent): Promise<void> {
  if (blobEnabled()) {
    const { put } = await import("@vercel/blob");
    await put(toPathname(e), "1", { access: "public", addRandomSuffix: true, contentType: "text/plain" });
    return;
  }
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.appendFile(LOCAL_FILE, JSON.stringify(e) + "\n");
}

export async function listEvents(): Promise<StoredEvent[]> {
  if (blobEnabled()) {
    const { list } = await import("@vercel/blob");
    const out: StoredEvent[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: "events/", limit: 1000, cursor });
      for (const b of page.blobs) {
        // addRandomSuffix inserts "-<random>" before the extension.
        const ev = fromPathname(b.pathname.replace(/-[A-Za-z0-9]+\.txt$/, ".txt"));
        if (ev) out.push(ev);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return out;
  }
  try {
    const text = await fs.readFile(LOCAL_FILE, "utf8");
    return text
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as StoredEvent);
  } catch {
    return [];
  }
}

export const __test = { toPathname, fromPathname };
