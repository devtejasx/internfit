"use client";

import { useState } from "react";
import { track } from "@/lib/track";

export function Feedback() {
  const [rating, setRating] = useState<number | null>(null);
  const [wouldUse, setWouldUse] = useState<"yes" | "maybe" | "no" | null>(null);
  const [minutes, setMinutes] = useState("");
  const [sent, setSent] = useState(false);

  if (sent)
    return (
      <section className="rounded-2xl border border-line bg-card p-4 text-center" role="status">
        <p className="font-semibold text-ink">Thanks! That helps a lot.</p>
      </section>
    );

  const mins = Number(minutes);
  const minsValid = minutes === "" || (Number.isFinite(mins) && mins >= 0 && mins <= 600);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === null || !minsValid) return;
    track("feedback_submitted", {
      rating,
      wouldUse: wouldUse ?? undefined,
      usualMinutes: minutes === "" ? undefined : Math.round(mins),
    });
    setSent(true);
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-accent/30 bg-accent-soft p-4 sm:p-5" aria-labelledby="fb-h">
      <h3 id="fb-h" className="font-semibold text-ink">
        Was this useful? (15 seconds)
      </h3>

      <fieldset className="mt-3">
        <legend className="text-sm text-ink">How useful was this for your application?</legend>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
              className={`size-11 rounded-xl border text-base font-semibold ${rating === n ? "border-accent bg-accent text-on-accent" : "border-line bg-card text-ink"}`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-1 flex justify-between text-xs text-muted" style={{ maxWidth: "15.5rem" }}>
          <span>Not useful</span>
          <span>Very useful</span>
        </p>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="text-sm text-ink">Would you use this before a real application?</legend>
        <div className="mt-2 flex gap-2">
          {(["yes", "maybe", "no"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={wouldUse === v}
              onClick={() => setWouldUse(v)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold capitalize ${wouldUse === v ? "border-accent bg-accent text-on-accent" : "border-line bg-card text-ink"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <label htmlFor="usual" className="text-sm text-ink">
          Without this tool, how many minutes would preparing this application usually take you? <span className="text-muted">(optional)</span>
        </label>
        <input
          id="usual"
          inputMode="numeric"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
          className="mt-2 block w-28 rounded-xl border border-line bg-card p-2 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="e.g. 45"
          aria-invalid={!minsValid}
        />
      </div>

      <button
        type="submit"
        disabled={rating === null}
        className="mt-4 rounded-xl bg-accent px-5 py-2.5 font-semibold text-on-accent disabled:opacity-40"
      >
        Send feedback
      </button>
    </form>
  );
}
