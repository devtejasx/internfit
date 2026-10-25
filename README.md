# InternFit

**Know if you fit before you apply.** InternFit is a free, mobile-first AI fit check for Indian college students. Paste your experience and one internship description, and in about 30 seconds you get:

- an honest fit verdict (Strong / Moderate / Stretch / Weak) and why
- skills that match, each with evidence quoted from your own text
- gaps (must-have vs. nice-to-have), with a step you can take this week to address each
- truthful resume bullet rewrites, editable with copy buttons
- an editable application message
- five likely interview questions, with talking points from your experience
- red flags in the listing (fees, CTC asked of interns…)

It was built for the Beep product challenge to address a problem seen across many public app reviews: students apply to dozens of roles, hear nothing back, and don't know why (see `docs/01-research-report.md`). It is an independent prototype, not affiliated with Beep.

## Stack
- Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- Server route `/api/analyze` calls the Gemini REST API with a JSON response schema. The key stays on the server.
- Anonymous experiment analytics: `/api/event` → Vercel Blob (production) or `.data/events.jsonl` (local). `/stats` dashboard plus CSV export.
- Vitest unit tests

## Run locally
```bash
npm install
cp .env.example .env.local   # then fill in GEMINI_API_KEY and STATS_KEY
npm run dev                  # http://localhost:3000
npm test                     # unit tests
npm run build                # production build check
```

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | yes | Google AI Studio key. Without it, `/api/analyze` returns a clear 503. |
| `GEMINI_MODEL` | no | Defaults to `gemini-2.5-flash` |
| `STATS_KEY` | for `/stats` | Shared secret sent as the `x-stats-key` header |
| `RATE_LIMIT_PER_10MIN` | no | Per-IP analyses per 10 min (default 8) |
| `DAILY_ANALYSIS_CAP` | no | Per-instance daily cap (default 500) |
| `BLOB_READ_WRITE_TOKEN` | prod | Set automatically when a Vercel Blob store is connected |

## Deploy (Vercel)
1. Push this repo to GitHub, then import it in Vercel (or `npx vercel`).
2. Project → Settings → Environment Variables: add `GEMINI_API_KEY` and `STATS_KEY` (Production + Preview).
3. Project → Storage → create or connect a **Blob** store. This injects `BLOB_READ_WRITE_TOKEN`.
4. Redeploy. Open the URL, run the sample, then check `/stats`.

## Safety and privacy
- Inputs are limited to 80–6,000 characters per field. Requests are rate-limited per IP and capped per day.
- The prompt forbids inventing facts. Matches must cite the student's own text, and missing numbers become `[placeholders]`.
- Text in student and job inputs is treated as data, so instructions embedded in it are ignored.
- InternFit stores no resume or job text. Server logs record only error codes. Analytics events carry a random per-attempt id and whitelisted coarse fields (see `src/lib/events.ts`). No IPs, names or contacts.
- On the Gemini free tier, Google may use submitted content to improve its products. The UI tells users this.

## Measuring the experiment
Primary metric: **task completion rate** = sessions with ≥1 `output_copied` ÷ sessions with `workflow_started`. Add `?c=<cohort>` to shared links (e.g. `?c=wa`) to split results by channel. Full plan in `docs/04-experiment-plan.md`.
