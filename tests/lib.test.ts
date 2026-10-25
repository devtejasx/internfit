import { describe, expect, it, vi } from "vitest";
import { parseAnalysis, InvalidAnalysisError } from "@/lib/analysis";
import { checkInput, parseAnalyzeBody } from "@/lib/input";
import { RateLimiter, DailyCap } from "@/lib/rateLimit";
import { analyzeWithGemini, GeminiError } from "@/lib/gemini";
import { sanitizeEvent, __test, type StoredEvent } from "@/lib/events";
import { computeStats, eventsToCsv } from "@/lib/stats";

const valid = {
  roleTitle: "Data Analyst Intern",
  fitBand: "Moderate",
  verdict: "You meet most requirements.",
  matches: [{ skill: "Excel", evidence: "pivot tables" }],
  gaps: [{ skill: "Python", importance: "nice-to-have", howToAddress: "Do a pandas mini project." }],
  bulletSuggestions: [{ original: "made dashboard", improved: "Built an Excel dashboard", why: "Action verb" }],
  applicationMessage: "Hello, I am applying…",
  interviewQuestions: [{ question: "Tell me about your dashboard", talkingPoints: "Kirana data" }],
  redFlags: [],
};

const long = (n: number) => "x".repeat(n);

describe("input validation", () => {
  it("accepts reasonable input", () => {
    expect(checkInput(long(100), long(100))).toEqual({});
  });
  it("rejects too-short and too-long text", () => {
    const e = checkInput("short", long(7000));
    expect(e.experience).toMatch(/at least/);
    expect(e.job).toMatch(/under/);
  });
  it("rejects malformed bodies", () => {
    expect(parseAnalyzeBody(null).ok).toBe(false);
    expect(parseAnalyzeBody({ experience: 5, job: [] }).ok).toBe(false);
    expect(parseAnalyzeBody("str").ok).toBe(false);
  });
  it("trims accepted input", () => {
    const r = parseAnalyzeBody({ experience: `  ${long(90)}  `, job: long(90) });
    expect(r.ok && r.input.experience.length).toBe(90);
  });
});

describe("parseAnalysis", () => {
  it("accepts a valid analysis", () => {
    expect(parseAnalysis(valid).fitBand).toBe("Moderate");
  });
  it("rejects an invalid fit band", () => {
    expect(() => parseAnalysis({ ...valid, fitBand: "Amazing" })).toThrow(InvalidAnalysisError);
  });
  it("rejects missing fields", () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest.verdict;
    expect(() => parseAnalysis(rest)).toThrow(InvalidAnalysisError);
  });
  it("caps list lengths", () => {
    const many = Array.from({ length: 50 }, () => ({ skill: "a", evidence: "b" }));
    expect(parseAnalysis({ ...valid, matches: many }).matches).toHaveLength(15);
  });
});

describe("rate limiting", () => {
  it("blocks after the limit within the window and recovers after it", () => {
    const rl = new RateLimiter(2, 1000);
    expect(rl.take("a", 0)).toBe(0);
    expect(rl.take("a", 10)).toBe(0);
    expect(rl.take("a", 20)).toBeGreaterThan(0);
    expect(rl.take("b", 20)).toBe(0);
    expect(rl.take("a", 1001)).toBe(0);
  });
  it("daily cap resets on a new UTC day", () => {
    const cap = new DailyCap(1);
    expect(cap.take(new Date("2026-10-25T10:00:00Z"))).toBe(true);
    expect(cap.take(new Date("2026-10-25T11:00:00Z"))).toBe(false);
    expect(cap.take(new Date("2026-10-26T00:00:01Z"))).toBe(true);
  });
});

describe("Gemini client", () => {
  const input = { experience: long(100), job: long(100) };
  const ok = (body: unknown, status = 200) =>
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));

  it("fails clearly without an API key", async () => {
    await expect(analyzeWithGemini(input, { apiKey: undefined })).rejects.toMatchObject({ code: "not_configured" });
  });
  it("parses a structured response and skips thought parts", async () => {
    const f = ok({ candidates: [{ content: { parts: [{ text: "thinking", thought: true }, { text: JSON.stringify(valid) }] } }] });
    const a = await analyzeWithGemini(input, { apiKey: "k", fetchImpl: f });
    expect(a.roleTitle).toBe("Data Analyst Intern");
    const [, init] = f.mock.calls[0];
    expect(init.headers["x-goog-api-key"]).toBe("k");
    expect(JSON.parse(init.body).generationConfig.responseMimeType).toBe("application/json");
  });
  it("maps 429 to quota", async () => {
    await expect(analyzeWithGemini(input, { apiKey: "k", fetchImpl: ok({}, 429) })).rejects.toMatchObject({ code: "quota" });
  });
  it("maps 500 to upstream", async () => {
    await expect(analyzeWithGemini(input, { apiKey: "k", fetchImpl: ok({ error: "x" }, 500) })).rejects.toMatchObject({ code: "upstream" });
  });
  it("maps non-JSON model text to bad_output", async () => {
    const f = ok({ candidates: [{ content: { parts: [{ text: "not json" }] } }] });
    await expect(analyzeWithGemini(input, { apiKey: "k", fetchImpl: f })).rejects.toMatchObject({ code: "bad_output" });
  });
  it("maps safety blocks to blocked", async () => {
    const f = ok({ promptFeedback: { blockReason: "SAFETY" } });
    await expect(analyzeWithGemini(input, { apiKey: "k", fetchImpl: f })).rejects.toMatchObject({ code: "blocked" });
  });
  it("times out", async () => {
    const hang: typeof fetch = (_u, init) =>
      new Promise((_, rej) => init!.signal!.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError"))));
    const err = await analyzeWithGemini(input, { apiKey: "k", fetchImpl: hang, timeoutMs: 20 }).catch((e) => e);
    expect(err).toBeInstanceOf(GeminiError);
    expect(err.code).toBe("timeout");
  });
});

describe("analytics events", () => {
  it("drops unknown names, bad ids and non-whitelisted meta", () => {
    expect(sanitizeEvent({ name: "hack", sid: "abcdefgh" })).toBeNull();
    expect(sanitizeEvent({ name: "workflow_started", sid: "BAD ID!" })).toBeNull();
    const e = sanitizeEvent({
      name: "feedback_submitted",
      sid: "abcdef12",
      meta: { rating: 4, resume: "my secret resume", email: "a@b.c", wouldUse: "yes", usualMinutes: 45.4, cohort: "pilot-1" },
    });
    expect(e?.meta).toEqual({ rating: "4", wouldUse: "yes", usualMinutes: "45", cohort: "pilot-1" });
  });
  it("rejects out-of-range values", () => {
    const e = sanitizeEvent({ name: "feedback_submitted", sid: "abcdef12", meta: { rating: 9, fitBand: "<script>" } });
    expect(e?.meta).toEqual({});
  });
  it("round-trips through the blob pathname encoding", () => {
    const e = sanitizeEvent(
      { name: "workflow_failed", sid: "abcdef12", meta: { errorCode: "client_timeout", cohort: "pilot-1", latencyMs: 1234 } },
      new Date("2026-10-25T12:34:56.789Z"),
    )!;
    const p = __test.toPathname(e);
    expect(p).not.toMatch(/[%?#\s]/);
    expect(__test.fromPathname(p)).toEqual(e);
    const bare = sanitizeEvent({ name: "workflow_started", sid: "abcdef12" }, new Date("2026-10-25T00:00:00.000Z"))!;
    expect(__test.fromPathname(__test.toPathname(bare))).toEqual(bare);
  });
});

describe("stats", () => {
  const ev = (name: StoredEvent["name"], sid: string, meta: Record<string, string> = {}, ts = "2026-10-25T10:00:00.000Z"): StoredEvent => ({
    name,
    sid,
    ts,
    meta,
  });
  const events: StoredEvent[] = [
    ev("workflow_started", "s1", { cohort: "p" }),
    ev("analysis_requested", "s1", { cohort: "p" }),
    ev("analysis_completed", "s1", { fitBand: "Strong", latencyMs: "20000", cohort: "p" }),
    ev("output_copied", "s1", { elapsedSec: "90", cohort: "p" }),
    ev("output_copied", "s1", { elapsedSec: "120", cohort: "p" }),
    ev("feedback_submitted", "s1", { rating: "5", wouldUse: "yes", usualMinutes: "40", cohort: "p" }),
    ev("workflow_started", "s2"),
    ev("analysis_requested", "s2"),
    ev("workflow_failed", "s2", { errorCode: "timeout" }),
    ev("workflow_started", "s3"),
  ];
  it("computes the primary metric per unique session", () => {
    const s = computeStats(events);
    expect(s.primary).toEqual({ started: 3, copied: 1, completionRate: 0.333 });
    expect(s.errorRate).toBe(0.5);
    expect(s.analysisSuccessRate).toBe(0.5);
    expect(s.medianSecondsToFirstCopy).toBe(90);
    expect(s.feedback).toMatchObject({ responses: 1, meanRating: 5, usefulShare: 1, wouldUseYesShare: 1, medianUsualMinutes: 40 });
    expect(s.byDay["2026-10-25"]).toEqual({ started: 3, copied: 1 });
  });
  it("excludes the internal test cohort from overall numbers", () => {
    expect(computeStats([...events, ev("workflow_started", "t1", { cohort: "test" })]).primary.started).toBe(3);
  });
  it("filters by cohort", () => {
    expect(computeStats(events, "p").primary.completionRate).toBe(1);
  });
  it("exports CSV without text content", () => {
    const csv = eventsToCsv(events);
    expect(csv.split("\n")[0]).toBe("ts,name,sid,cohort,elapsedSec,errorCode,fitBand,latencyMs,rating,usualMinutes,wouldUse");
    expect(csv.trim().split("\n")).toHaveLength(events.length + 1);
  });
});
