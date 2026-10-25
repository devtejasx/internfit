import { FitCheck } from "@/components/FitCheck";

const STEPS = [
  { t: "Paste your experience", d: "Resume text or a quick list of skills and projects. Hinglish is fine." },
  { t: "Paste the internship", d: "The full description from any app, site or WhatsApp forward." },
  { t: "Get an honest answer", d: "Fit verdict, gaps, truthful resume tweaks, a message to send, and interview prep." },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
      <header className="flex items-center justify-between py-4">
        <span className="text-lg font-bold tracking-tight text-ink">
          Intern<span className="text-accent">Fit</span>
        </span>
        <span className="rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-muted">Free · no sign-up</span>
      </header>

      <section className="pt-6 pb-8 sm:pt-10">
        <h1 className="text-3xl leading-tight font-bold tracking-tight text-ink sm:text-4xl">
          Know if you fit <span className="text-accent">before</span> you apply.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Stop sending 30 applications and hearing nothing. Paste your experience and one internship description. In about 30 seconds you&apos;ll get an
          honest fit check, what to fix, and an application you can send. Nothing is made up.
        </p>
        <a
          href="#check"
          className="mt-6 inline-block rounded-2xl bg-accent px-6 py-3.5 font-semibold text-on-accent shadow-sm hover:brightness-110"
        >
          Check my fit
        </a>

        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.t} className="rounded-2xl border border-line bg-card p-4">
              <p className="text-sm font-semibold text-accent">Step {i + 1}</p>
              <p className="mt-1 font-semibold text-ink">{s.t}</p>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <FitCheck />

      <footer className="mt-16 border-t border-line pt-6 text-xs leading-relaxed text-muted">
        <p>
          InternFit is an independent student-built prototype made for a product challenge. It is not affiliated with any job platform. AI output can
          be wrong; always check it before you use it. Your text is processed by Google Gemini and is not stored by InternFit. On Google&apos;s free API
          tier, Google may use submitted text to improve its services, so don&apos;t paste phone numbers, emails or ID numbers.
        </p>
      </footer>
    </main>
  );
}
