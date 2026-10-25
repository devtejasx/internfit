import { NextResponse } from "next/server";
import { recordEvent, sanitizeEvent } from "@/lib/events";
import { RateLimiter } from "@/lib/rateLimit";


const limiter = new RateLimiter(60, 10 * 60_000);

export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") ?? 0) > 2_000) return new NextResponse(null, { status: 413 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const event = sanitizeEvent(body);
  if (!event) return new NextResponse(null, { status: 400 });
  if (limiter.take(event.sid) > 0) return new NextResponse(null, { status: 429 });
  try {
    await recordEvent(event);
  } catch (err) {
    console.error(`[event] store failed: ${(err as Error).message}`);
    return new NextResponse(null, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
