"use client";

import { useEffect, useRef, useState } from "react";
import type { Analysis } from "@/lib/analysis";
import { checkInput, LIMITS, type InputErrors } from "@/lib/input";
import { resetWorkflow, track } from "@/lib/track";
import { SAMPLE_EXPERIENCE, SAMPLE_JOB } from "@/lib/sample";
import { Results } from "./Results";

type Phase =
  | { kind: "editing" }
  | { kind: "loading"; startedAt: number }
  | { kind: "error"; message: string; code: string }
  | { kind: "done"; analysis: Analysis };

const CLIENT_TIMEOUT_MS = 65_000;

const LOADING_STEPS = [
  "Reading the internship description…",
  "Matching it against your experience…",
  "Finding honest gaps…",
  "Drafting your message and interview prep…",
];

export function FitCheck() {
  const [experience, setExperience] = useState("");
  const [job, setJob] = useState("");
  const [errors, setErrors] = useState<InputErrors>({});
  const [phase, setPhase] = useState<Phase>({ kind: "editing" });
  const [step, setStep] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase.kind !== "loading") return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 6000);
    return () => clearInterval(id);
  }, [phase.kind]);

  useEffect(() => {
    if (phase.kind === "done" || phase.kind === "error") resultsRef.current?.focus();
  }, [phase.kind]);

  const started = () => track("workflow_started");

  async function analyse(e: React.FormEvent) {
    e.preventDefault();
    started();
    const errs = checkInput(experience, job);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(() => controller.abort("timeout"), CLIENT_TIMEOUT_MS);
    const t0 = Date.now();
    setStep(0);
    setPhase({ kind: "loading", startedAt: t0 });
    track("analysis_requested");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ experience, job }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.analysis) {
        const code = typeof data.code === "string" ? data.code : `http_${res.status}`;
        if (data.fields) setErrors(data.fields);
        track("workflow_failed", { errorCode: code.replace(/[^a-z_]/g, "_").slice(0, 24) });
        setPhase({ kind: "error", code, message: data.error ?? "Something went wrong. Please try again." });
        return;
      }
      track("analysis_completed", { fitBand: data.analysis.fitBand, latencyMs: Date.now() - t0 });
      setPhase({ kind: "done", analysis: data.analysis });
    } catch {
      const reason = controller.signal.reason;
      if (reason === "cancelled") {
        setPhase({ kind: "editing" });
        return;
      }
      const code = reason === "timeout" ? "client_timeout" : "network";
      track("workflow_failed", { errorCode: code });
      setPhase({
        kind: "error",
        code,
        message:
          code === "client_timeout"
            ? "This is taking longer than a minute. Your connection or the AI may be slow. Please try again."
            : "Couldn't reach the server. Check your internet connection and try again.",
      });
    } finally {
      clearTimeout(timer);
      abortRef.current = null;
    }
  }

  function startOver() {
    resetWorkflow();
    setExperience("");
    setJob("");
    setErrors({});
    setPhase({ kind: "editing" });
    document.getElementById("check")?.scrollIntoView({ behavior: "smooth" });
  }

  function fillSample() {
    started();
    setExperience(SAMPLE_EXPERIENCE);
    setJob(SAMPLE_JOB);
    setErrors({});
  }

  const loading = phase.kind === "loading";

  return (
    <section id="check" aria-labelledby="check-heading" className="scroll-mt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="check-heading" className="text-xl font-semibold text-ink">
          Check your fit
        </h2>
        {phase.kind === "editing" && (
          <button type="button" onClick={fillSample} className="text-sm font-medium text-accent underline underline-offset-4">
            Try with a sample
          </button>
        )}
      </div>

      {phase.kind !== "done" && (
        <form onSubmit={analyse} noValidate className="mt-4 space-y-5">
          <Field
            id="experience"
            label="1. About you"
            hint="Paste your resume text, or just list your education, skills, projects, internships and achievements. Informal is fine. Remove your phone number and email."
            placeholder={"B.Tech CSE, 3rd year, XYZ College, Nagpur\nSkills: Python, SQL, Excel\nProject: built a Flask app that…"}
            value={experience}
            onChange={(v) => setExperience(v)}
            onFocus={started}
            error={errors.experience}
            max={LIMITS.experienceMax}
            disabled={loading}
          />
          <Field
            id="job"
            label="2. The internship"
            hint="Paste the full internship or job description: role, responsibilities, requirements."
            placeholder={"Data Analyst Intern – Acme Pvt Ltd\nRequirements: SQL, Excel, basic Python…"}
            value={job}
            onChange={(v) => setJob(v)}
            onFocus={started}
            error={errors.job}
            max={LIMITS.jobMax}
            disabled={loading}
          />

          {loading ? (
            <div role="status" aria-live="polite" className="rounded-2xl border border-line bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="size-5 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden />
                <p className="font-medium text-ink">{LOADING_STEPS[step]}</p>
              </div>
              <p className="mt-1 text-sm text-muted">Usually 15–40 seconds.</p>
              <button
                type="button"
                onClick={() => abortRef.current?.abort("cancelled")}
                className="mt-3 text-sm font-medium text-muted underline underline-offset-4"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full rounded-2xl bg-accent px-5 py-4 text-base font-semibold text-on-accent shadow-sm transition hover:brightness-110 focus-visible:outline-offset-4 sm:w-auto"
            >
              Check my fit
            </button>
          )}
          <p className="text-xs leading-relaxed text-muted">
            Your text is sent to Google&apos;s Gemini AI only to produce this analysis. We don&apos;t save it. Anonymous usage
            counts (no text) help us measure whether this tool works.
          </p>
        </form>
      )}

      <div ref={resultsRef} tabIndex={-1} className="outline-none">
        {phase.kind === "error" && (
          <div role="alert" className="mt-5 rounded-2xl border border-bad/40 bg-bad-soft p-4">
            <p className="font-semibold text-ink">Couldn&apos;t complete the check</p>
            <p className="mt-1 text-sm text-ink/80">{phase.message}</p>
            <button
              type="button"
              onClick={() => setPhase({ kind: "editing" })}
              className="mt-3 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-page"
            >
              Edit and try again
            </button>
          </div>
        )}
        {phase.kind === "done" && <Results analysis={phase.analysis} onStartOver={startOver} />}
      </div>
    </section>
  );
}

function Field(props: {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onFocus: () => void;
  error?: string;
  max: number;
  disabled: boolean;
}) {
  const over = props.value.length > props.max;
  return (
    <div>
      <label htmlFor={props.id} className="block font-semibold text-ink">
        {props.label}
      </label>
      <p id={`${props.id}-hint`} className="mt-1 text-sm text-muted">
        {props.hint}
      </p>
      <textarea
        id={props.id}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onFocus={props.onFocus}
        placeholder={props.placeholder}
        rows={7}
        disabled={props.disabled}
        aria-invalid={!!props.error}
        aria-describedby={`${props.id}-hint ${props.id}-count${props.error ? ` ${props.id}-err` : ""}`}
        className="mt-2 w-full resize-y rounded-2xl border border-line bg-card p-3 text-base leading-relaxed text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60 aria-[invalid=true]:border-bad"
      />
      <div className="mt-1 flex justify-between gap-3 text-xs">
        <span id={`${props.id}-err`} className="text-bad">
          {props.error}
        </span>
        <span id={`${props.id}-count`} className={over ? "font-semibold text-bad" : "text-muted"}>
          {props.value.length.toLocaleString("en-IN")} / {props.max.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}
