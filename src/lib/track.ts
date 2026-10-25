"use client";

// Browser side of the experiment analytics. One random id per workflow
// attempt; no cookies, no localStorage, no text content.

import type { EventName } from "./events";

function newSid(): string {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) return Math.random().toString(36).slice(2, 12).padEnd(8, "0");
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

let sid = newSid();

let startedAt: number | null = null;

function cohort(): string | undefined {
  if (typeof location === "undefined") return undefined;
  const c = new URLSearchParams(location.search).get("c");
  return c && /^[a-z0-9-]{1,24}$/.test(c) ? c : undefined;
}

export function track(name: EventName, meta: Record<string, string | number | undefined> = {}) {
  if (name === "workflow_started") {
    if (startedAt !== null) return; // once per attempt
    startedAt = Date.now();
  }
  const payload: Record<string, unknown> = { ...meta, cohort: cohort() };
  if (startedAt !== null && (name === "output_copied" || name === "feedback_submitted"))
    payload.elapsedSec = (Date.now() - startedAt) / 1000;
  const body = JSON.stringify({ name, sid, meta: payload });
  try {
    if (navigator.sendBeacon?.("/api/event", new Blob([body], { type: "application/json" }))) return;
  } catch {
    // fall through to fetch
  }
  fetch("/api/event", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(
    () => {},
  );
}

/** "Start over" begins a new attempt, so it gets a fresh anonymous id. */
export function resetWorkflow() {
  sid = newSid();
  startedAt = null;
}
