import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { listEvents } from "@/lib/events";
import { computeStats, eventsToCsv } from "@/lib/stats";


function authorized(req: Request): boolean {
  const expected = process.env.STATS_KEY;
  if (!expected) return false;
  const given = req.headers.get("x-stats-key") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  if (!process.env.STATS_KEY)
    return NextResponse.json({ error: "STATS_KEY is not configured on the server." }, { status: 503 });
  if (!authorized(req)) return NextResponse.json({ error: "Wrong or missing stats key." }, { status: 401 });

  const url = new URL(req.url);
  const cohort = url.searchParams.get("cohort") || null;
  const events = await listEvents();
  if (url.searchParams.get("format") === "csv") {
    const rows = cohort ? events.filter((e) => e.meta.cohort === cohort) : events;
    return new NextResponse(eventsToCsv(rows), {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="internfit-events.csv"' },
    });
  }
  return NextResponse.json(computeStats(events, cohort), { headers: { "cache-control": "no-store" } });
}
