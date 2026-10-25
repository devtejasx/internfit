# InternFit — Product Definition (Phase 2)

*An independent prototype built for the Beep product challenge. It is not affiliated with or endorsed by Beep.*

1. **Target user:** an Indian college student (Tier 2/3, any branch) about to apply to a specific internship or entry-level role, usually on a phone.

2. **Specific problem (P2):** students apply to dozens of roles ("applied for 28 jobs and got selected by none") without knowing whether they fit or why they were rejected. The only feedback, Beep's rejection report, arrives 7–10 days later and is paywalled.

3. **Current workaround:** apply broadly with one generic resume. Wait. Pay for a report, or guess. Ask seniors. Paste into ChatGPT with an ad-hoc prompt, which tends to invent experience and has no structure.

4. **Proposed solution:** paste your experience and the internship description. In under a minute you get an **honest, explained fit check** *before* you apply:
   - an overall fit verdict (Strong / Moderate / Stretch / Weak) and why
   - skills matched, each with evidence quoted from *your* text
   - gaps (must-have vs. nice-to-have), each with a concrete way to close it or address it honestly
   - truthful resume bullet rewrites, using only facts you provided
   - an editable application message
   - five likely interview questions, with talking points from your experience
   - listing red flags (fees, CTC/experience asked of interns, vague pay)

5. **Why AI is needed:** you have to semantically match free-form, messy text (Hinglish, projects described casually) against job requirements. You have to judge evidence ("built a Flask app" means you know Python), and rewrite text per role. Keyword rules can't do this. Templates can't personalise it.

6. **Main journey:** landing → "Check my fit" → paste experience (≤6,000 chars) → paste internship description (≤6,000 chars) → Analyse (~15–30 s) → read the verdict → edit and copy the bullets and message → rate usefulness.

7. **MVP scope:** one page, no login. Text paste only. One Gemini call returns structured JSON. Editable outputs with copy buttons. Feedback widget. Anonymous event counts. Stats page for the experiment.

8. **Deliberately not built:** accounts, job listings or search, PDF parsing, saved history, chatbot, multi-language UI, payments, auto-apply, resume PDF generation.

9. **Success metric:** see `04-experiment-plan.md`. Primary metric: task completion rate, meaning the share of sessions that start the workflow and copy at least one output.

10. **Risks, assumptions, privacy:**
    - *Hallucinated qualifications:* the prompt forbids inventing facts. Every matched skill must quote evidence from the input. The UI warns that a bullet should be edited if it's untrue.
    - *Over-trusting the score:* we show a verdict band, not a precise percentage, and explain it.
    - *Privacy:* resume and job text are sent to Google's Gemini API for that one request only. We don't store them, and analytics don't contain them. Analytics hold only an event name, a random session ID, timestamp, coarse metadata (fit band, input-length bucket, latency) and, for feedback, the 1–5 rating and the time estimate. No IP, no name, no contact details. Note: on the Gemini free tier, Google may use inputs to improve its products. We say this on the page, and advise students to remove phone and email before pasting.
    - *Assumptions to test:* students will paste a full description; a pre-apply fit check changes their application behaviour; 30 s latency is acceptable on 4G.
    - *Abuse/cost:* per-IP rate limit, a daily global cap, and input length limits.
