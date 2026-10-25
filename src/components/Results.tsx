"use client";

import { useRef, useState } from "react";
import type { Analysis, FitBand } from "@/lib/analysis";
import { track } from "@/lib/track";
import { Feedback } from "./Feedback";

const BAND_STYLE: Record<FitBand, { cls: string; label: string }> = {
  Strong: { cls: "bg-good-soft text-good border-good/40", label: "Strong fit" },
  Moderate: { cls: "bg-accent-soft text-accent border-accent/40", label: "Moderate fit" },
  Stretch: { cls: "bg-warn-soft text-warn border-warn/40", label: "Stretch" },
  Weak: { cls: "bg-bad-soft text-bad border-bad/40", label: "Weak fit" },
};

export function Results({ analysis, onStartOver }: { analysis: Analysis; onStartOver: () => void }) {
  const band = BAND_STYLE[analysis.fitBand];
  const [message, setMessage] = useState(analysis.applicationMessage);
  const [bullets, setBullets] = useState(analysis.bulletSuggestions.map((b) => b.improved));
  const edited = useRef(new Set<string>());

  const markEdited = (section: string) => {
    if (edited.current.has(section)) return;
    edited.current.add(section);
    track("output_edited", { section });
  };

  const prepText = analysis.interviewQuestions
    .map((q, i) => `${i + 1}. ${q.question}\n   Talking points: ${q.talkingPoints}`)
    .join("\n\n");

  return (
    <div className="mt-6 space-y-5">
      <Card>
        <p className="text-sm text-muted">{analysis.roleTitle}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${band.cls}`}>{band.label}</span>
        </div>
        <p className="mt-3 leading-relaxed text-ink">{analysis.verdict}</p>
        <p className="mt-3 text-xs text-muted">
          This is an AI estimate from the text you pasted, not a recruiter&apos;s decision. Check every suggestion before you use it.
        </p>
      </Card>

      {analysis.redFlags.length > 0 && (
        <Card tone="warn" title="Check these in the listing">
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
            {analysis.redFlags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Genuine internships never ask you to pay a fee to apply.</p>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Card title={`What already matches (${analysis.matches.length})`}>
          {analysis.matches.length === 0 ? (
            <Empty>No clear matches found in what you pasted.</Empty>
          ) : (
            <ul className="space-y-3">
              {analysis.matches.map((m, i) => (
                <li key={i}>
                  <p className="font-medium text-ink">✓ {m.skill}</p>
                  <p className="text-sm text-muted">From your text: “{m.evidence}”</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={`Gaps to address (${analysis.gaps.length})`}>
          {analysis.gaps.length === 0 ? (
            <Empty>No significant gaps found.</Empty>
          ) : (
            <ul className="space-y-3">
              {analysis.gaps.map((g, i) => (
                <li key={i}>
                  <p className="font-medium text-ink">
                    {g.skill}{" "}
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${g.importance === "must-have" ? "bg-bad-soft text-bad" : "bg-line text-muted"}`}
                    >
                      {g.importance}
                    </span>
                  </p>
                  <p className="text-sm text-muted">{g.howToAddress}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title="Application message"
        action={<CopyButton text={message} section="message" label="Copy message" />}
      >
        <label htmlFor="msg" className="sr-only">
          Application message (editable)
        </label>
        <textarea
          id="msg"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            markEdited("message");
          }}
          rows={9}
          className="w-full resize-y rounded-xl border border-line bg-page p-3 text-base leading-relaxed text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <p className="mt-1 text-xs text-muted">Edit freely. Make sure every sentence is true for you.</p>
      </Card>

      <Card
        title="Resume bullet improvements"
        action={
          bullets.length > 0 ? <CopyButton text={bullets.map((b) => `• ${b}`).join("\n")} section="bullets_all" label="Copy all" /> : null
        }
      >
        {bullets.length === 0 ? (
          <Empty>No bullet changes suggested.</Empty>
        ) : (
          <ol className="space-y-4">
            {analysis.bulletSuggestions.map((b, i) => (
              <li key={i} className="rounded-xl border border-line p-3">
                {b.original && <p className="text-sm text-muted line-through decoration-muted/50">{b.original}</p>}
                <label htmlFor={`bullet-${i}`} className="sr-only">
                  Improved bullet {i + 1} (editable)
                </label>
                <textarea
                  id={`bullet-${i}`}
                  value={bullets[i]}
                  onChange={(e) => {
                    setBullets((bs) => bs.map((x, j) => (j === i ? e.target.value : x)));
                    markEdited("bullets");
                  }}
                  rows={3}
                  className="mt-1 w-full resize-y rounded-lg border border-line bg-page p-2 text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <div className="mt-1 flex items-start justify-between gap-3">
                  <p className="text-xs text-muted">{b.why}</p>
                  <CopyButton text={bullets[i]} section="bullet" label="Copy" small />
                </div>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-muted">
          Text in [brackets] is a placeholder. Fill it in only if it&apos;s true, or delete it.
        </p>
      </Card>

      <Card title="Likely interview questions" action={<CopyButton text={prepText} section="interview" label="Copy all" />}>
        <ol className="space-y-2">
          {analysis.interviewQuestions.map((q, i) => (
            <li key={i}>
              <details className="group rounded-xl border border-line p-3 open:bg-page">
                <summary className="cursor-pointer list-none font-medium text-ink">
                  <span className="mr-2 text-muted">{i + 1}.</span>
                  {q.question}
                  <span className="ml-2 text-xs text-accent group-open:hidden">Show talking points</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted">{q.talkingPoints}</p>
              </details>
            </li>
          ))}
        </ol>
      </Card>

      <Feedback />

      <button
        type="button"
        onClick={onStartOver}
        className="w-full rounded-2xl border border-line bg-card px-5 py-3 font-semibold text-ink sm:w-auto"
      >
        Check another internship
      </button>
    </div>
  );
}

function Card(props: { title?: string; action?: React.ReactNode; tone?: "warn"; children: React.ReactNode }) {
  return (
    <section
      className={`rounded-2xl border p-4 sm:p-5 ${props.tone === "warn" ? "border-warn/40 bg-warn-soft" : "border-line bg-card"}`}
    >
      {(props.title || props.action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {props.title && <h3 className="font-semibold text-ink">{props.title}</h3>}
          {props.action}
        </div>
      )}
      {props.children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}

// Fallback for older Android browsers and non-secure contexts without the async clipboard API.
function legacyCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    ta.remove();
  }
}

export function CopyButton({ text, section, label, small }: { text: string; section: string; label: string; small?: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = legacyCopy(text);
    }
    if (ok) {
      setState("copied");
      track("output_copied", { section });
    } else {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  }
  return (
    <button
      type="button"
      onClick={copy}
      disabled={!text.trim()}
      className={`shrink-0 rounded-lg border border-accent/40 font-semibold text-accent hover:bg-accent-soft disabled:opacity-40 ${small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}
    >
      <span aria-live="polite">{state === "copied" ? "Copied ✓" : state === "failed" ? "Select & copy manually" : label}</span>
    </button>
  );
}
