import { NextResponse } from "next/server";
import { analyzeWithGemini, GeminiError } from "@/lib/gemini";
import { parseAnalyzeBody } from "@/lib/input";
import { DailyCap, RateLimiter } from "@/lib/rateLimit";

export const maxDuration = 60;

const perIp = new RateLimiter(Number(process.env.RATE_LIMIT_PER_10MIN ?? 8), 10 * 60_000);
const daily = new DailyCap(Number(process.env.DAILY_ANALYSIS_CAP ?? 500));

const USER_MESSAGES: Record<string, { status: number; message: string }> = {
  not_configured: { status: 503, message: "The AI service isn't configured yet. Please try again later." },
  timeout: { status: 504, message: "The AI took too long to respond. Please try again; shorter inputs are faster." },
  quota: { status: 503, message: "We've hit today's AI usage limit. Please try again in a little while." },
  upstream: { status: 502, message: "The AI service had a problem. Please try again." },
  blocked: { status: 422, message: "The AI couldn't process this text. Remove anything unusual and try again." },
  bad_output: { status: 502, message: "The AI returned an unusable answer. Please try again." },
};

function clientKey(req: Request): string {
  // Used only as an in-memory rate-limit key; never logged or stored.
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") ?? 0) > 40_000)
    return NextResponse.json({ error: "Request too large.", code: "too_large" }, { status: 413 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON.", code: "invalid_input" }, { status: 400 });
  }
  const parsed = parseAnalyzeBody(body);
  if (!parsed.ok)
    return NextResponse.json({ error: "Please fix the highlighted fields.", code: "invalid_input", fields: parsed.errors }, { status: 400 });

  const wait = perIp.take(clientKey(req));
  if (wait > 0)
    return NextResponse.json(
      { error: `You're going a bit fast. Try again in ${Math.ceil(wait / 60)} min.`, code: "rate_limited" },
      { status: 429, headers: { "retry-after": String(wait) } },
    );
  if (!daily.take())
    return NextResponse.json({ error: USER_MESSAGES.quota.message, code: "quota" }, { status: 503 });

  const started = Date.now();
  try {
    const analysis = await analyzeWithGemini(parsed.input, {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL,
      timeoutMs: 50_000,
    });
    return NextResponse.json({ analysis, latencyMs: Date.now() - started });
  } catch (err) {
    const code = err instanceof GeminiError ? err.code : "upstream";
    // Log the technical reason only; never the student's text.
    console.error(`[analyze] ${code}: ${(err as Error).message}`);
    const m = USER_MESSAGES[code] ?? USER_MESSAGES.upstream;
    return NextResponse.json({ error: m.message, code }, { status: m.status });
  }
}
