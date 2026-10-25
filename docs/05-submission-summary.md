# InternFit: Beep Product Challenge Submission

**Live:** https://internfit-drab.vercel.app · **Code:** https://github.com/devtejasx/internfit
*Status 2026-10-25: deployed. The AI step goes live once the Gemini key is added. No student interviews or experiment data yet.*

## 1. What student problem I found
I pulled **4,119 public reviews** of the Beep app (3,701 Play Store and 418 App Store, up to 2026-10-24). I hand-reviewed and coded the **192 negative reviews (1–2★) from the last 24 months**:

| Rank | Problem | Negative reviews (24 mo) | Evidence |
|---|---|---|---|
| 1 | **Paid-certificate and Pro trust:** paid but no certificate, unclear pricing, autopay debits, no support | 74 (39%) | "I Paid ₹699 for the 5-certificate package but received only one…" (Play, 2026-10-07) |
| 2 | **Applying is a black hole:** irrelevant or sparse roles, no response, and rejection feedback that is slow and paywalled | 41 (21%) | "I applied for 28 jobs and got selected by none" (Play, 2025-05-24) · "after 10 days they say that report is ready and if u want to view it take premium" (Play, 2025-09-26) |
| 3 | **Access friction:** OTP/login failures, app won't open, resume upload broken | 16 (8%) | "can't signup, shows network unavailable after typing otp" (Play, 2025-08-31) |

The current store listing has pivoted to "Skill Certifications". That explains why problem 1 is growing in 2026.

## 2. Why I built for problem 2, not problem 1
- Problem 1 is the most urgent issue. **I'm flagging it for the founder's office as a billing and operations fix:** show the price before the test, require explicit autopay consent with in-app cancel, guarantee certificate delivery, and set a support SLA. An outside AI app can't fix it.
- Problem 2 is the core career outcome students come to Beep for. Beep's own rejection report shows the demand: one 5★ reviewer says the best thing is learning "where your application got rejected". But the report takes 7–10 days and sits behind a paywall. **InternFit gives that answer instantly, before applying, for free.**
- **Upside for Beep:** an honest gap analysis is the *truthful* reason to take a Beep skill assessment. It ties certification to outcomes instead of to pricing pressure.

## 3. What was built
**InternFit:** paste your experience and one internship description. In about 30 s you get:
- a fit verdict (Strong / Moderate / Stretch / Weak) and why
- matched skills, each with **evidence quoted from your own text**
- gaps, each with a concrete step for this week
- truthful resume bullet rewrites (no invented facts; missing numbers become `[placeholders]`)
- an editable application message
- five likely interview questions with talking points
- listing red flags (fees, CTC asked of interns)

Mobile-first. No login. Every output is editable and has a copy button.

**Stack:** Next.js 16, Tailwind 4, Gemini 2.5 Flash (structured JSON output), Vercel (Mumbai region), Vercel Blob for anonymous analytics.

**Safety:**
- input limits, per-IP rate limit, daily cap
- the API key stays server-side
- no resume or job text is stored or logged
- analytics hold only whitelisted coarse fields

## 4. The metric it is designed to move
**Task completion rate:** the share of sessions that start the workflow and copy at least one output.
- **Target:** ≥60% in moderated sessions, ≥35% unmoderated
- **Secondary:** time to first copy ≤5 min, ≥70% rate it useful, error rate ≤5%, self-reported time saved >15 min

Tracked live at `/stats`, with CSV export. Full design, including the decision rule, is in `04-experiment-plan.md`.

## 5. What has actually been measured
- **Product metrics: nothing yet.** The experiment hasn't started.
- **Engineering:**
  - 24 unit tests pass
  - error paths verified locally and in production: validation, missing key, rate limit, oversize, auth
  - analytics write and read verified in production
- **Not yet verified:** real AI output quality and latency (waiting on the API key) and real-phone testing.

## 6. What should happen next
1. Add the Gemini key, then run 2 pilot sessions and fix friction (day 1).
2. Run 8–12 moderated student sessions with the interview kit, plus 3–5 WhatsApp-group links with `?c=` cohort codes (days 2–5).
3. On day 7, apply the decision rule: continue, change the biggest drop-off step, or stop.
4. If it continues, run it inside Beep and measure the real outcome: **shortlist rate per application**.
5. Separately, fix problem 1. It is costing ratings and trust today.

## Demo script (90 seconds)
1. Open the live URL on a phone and read the headline. Problem framing: "28 applications, zero responses."
2. Tap **Try with a sample** (a fictional B.Com student and a data-analyst internship), then **Check my fit**.
3. Show the verdict band and why. Show matches quoting the student's own words. Show the must-have SQL gap and how to close it this week.
4. Edit one resume bullet and fill in a `[placeholder]`. Copy the application message.
5. Submit the 3-question feedback.
6. Open `/stats` and show the completion-rate tile update.
