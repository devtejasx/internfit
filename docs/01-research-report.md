# Beep — Student Problem Research (Phase 1)

Prepared 2026-10-25. Everything below is from public app-store data pulled on that date. **No app install, no student interviews have happened yet** — those are marked as pending.

## 1. Sources verified

| Source | What it is | Verified as Beep? |
|---|---|---|
| Google Play `com.eventbeep.android` | "Beep: Skill Certifications", EventBeep Technoservices Pvt Ltd. 4.0★ from 4,794 ratings (3,652 written reviews), 500,000+ installs, v5.61.2 updated 2026-10-09, released 2017-01-04. IAP "₹99.00 per item". | Yes, developer name matches the company. |
| Apple App Store id1476715510 | "Beep: Skill Certifications", Eventbeep Technoservices. 4.3★ from 962 ratings, v5.61.2 (9 Oct). | Yes. |
| eventbeep.com/en/about-us | Says Beep runs since 2019 for Tier 2/3 college students: Job Hub, Upskill, Resources, Beep School of Design, Go Premium. Shark Tank logo shown. **The page gives no user count.** The "1M+ users" figure in the brief is not confirmed by this page. | Yes. |

**Observed fact, and it matters:** the current store listings describe Beep as a *skill-assessment and certificate* product: "Take a real, timed skill assessment… earn a verified certificate". Jobs and internships no longer appear in the Play description. Career tools ("resume building, interview preparation") are listed as secondary. Older reviews (2021–2025) are mostly about internships and jobs. So the product has changed, and its review history covers both versions.

## 2. Dataset and method

- **Google Play:** 3,701 reviews (2017-01-05 → 2026-10-24), pulled with `google-play-scraper` (lang=en, country=in, sorted newest).
- **App Store:** 418 reviews (2019-09-25 → 2026-10-18), pulled from Apple's public customer-reviews RSS feed (India).
- **Analysis window:** the last 24 months (2024-10-25 → 2026-10-24). That is **1,345 reviews**: 1,121 are 4–5★ and **192 are 1–2★**.
- **Coding:** the 192 negative reviews were tagged with keyword rules per theme. I then read them by hand: the full list was reviewed and quotes were checked against the raw text. A review can carry more than one theme. Keyword coding is approximate, so the counts below are **order-of-magnitude evidence, not exact figures**. 72 negative reviews were too generic to code (e.g. "worst app").
- **Bias warning (observed):** 14 negative reviews say positive reviews are written by Beep interns or "campus influencers" as a task (e.g. Play 2025-06-10, 2026-02-09, 2026-04-20). I cannot verify this. It does mean the 4–5★ share should not be read as clean satisfaction data. Negative reviews are also self-selected. Neither group represents all users.

Raw data and the coded CSV are in `evidence/reviews/`.

## 3. Evidence table

Counts = independent negative reviews (1–2★) in the 24-month window that match the theme. Each review comes from a separate reviewer account.

| # | Problem hypothesis | Exact quote(s) (source, date) | Count | Student impact | Confidence |
|---|---|---|---|---|---|
| P1 | **Students pay for certificates or Pro and don't get what they think they paid for. They can't get support or a refund, and the pricing feels misleading.** | "I Paid ₹699 for the 5-certificate package but received only one ₹299-type certificate" (Play, 2026-10-07) · "Even after paying, they ask for extra money for every certificate. Pricing is unclear" (Play, 2026-10-11) · "I had activated the autopay… even after I deactivated it, the app still deducted money" (Play, 2025-07-09) · "No response in whatsapp n email. I trusted and paid money." (Play, 2026-10-21) | **74** (39% of negatives; 29 in the last 12 months). Sub-themes: certificate not delivered ≥7, autopay or unauthorised debit ≥8, paid but no support ≥8, value doubt ≥9 | Direct money loss for low-income students. Destroys trust and drives 1★ reviews. | **High** (most frequent theme and rising; concrete amounts and dates) |
| P2 | **Applying feels like a black hole: few relevant roles for the student's domain or city, no recruiter response, and no fast explanation of why.** | "I applied for 28 jobs and got selected by none" (Play, 2025-05-24) · "I have applied nearly 50 internships and i Didn't even get the response from even single one" (Play, 2024-12-25) · "after 10 days they say that report is ready and if u want to view it take premium" (Play, 2025-09-26) · "Almost no pharma-related roles appear" (Play, 2025-09-20) · "Not relevant job showing. Mostly jobs for sales only." (Play, 2025-03-01) | **41** (21%; mostly Jan–Sep 2025): 15 no-response/no-feedback, 28 irrelevant or sparse listings | Students spend many applications for nothing and lose motivation. They don't learn what to fix. | **Medium-High** (consistent and specific, but it fades in the last 12 months as the product moves away from jobs) |
| P3 | **Access and setup friction: OTP/login failures, the app not opening, resume upload or edit not working.** | "can't signup, shows network unavailable after typing otp" (Play, 2025-08-31) · "I also tried uploading my resume multiple times, but it never worked" (Play, 2025-05-31) · "resume edit hi nahi ho rha hai" (Play, 2026-03-16) · "app khulta hee nahi hai" (iOS, 2026-10-18) | **16** (8%): 10 login/app-open, 6 resume upload/edit | Blocks the first session entirely, so students churn before seeing any value. | **Medium** (fewer reports; may be device-specific; I have not reproduced it) |

**Supporting signal for P2, observed in a positive review:** "the best thing is the report of internship where u get where your application got rejected" (Play, 2024-04-16, 5★). Students value knowing *why* they don't fit. The complaints are that this report arrives slowly (7–10 days) and is behind a paywall. One reviewer said it had "such basic information which us just obvious" (Play, 2025-01-24).

**Facts vs. hypotheses:**
- **Facts:** the quotes, counts, ratings and listing text above.
- **Hypotheses (not yet validated with students):** that P2 comes from students not knowing which roles they actually fit and how to present themselves; that an instant, explained fit check would change who they apply to and how; that P1 drives most uninstalls.

## 4. Prioritisation

Scored 1–5 (5 = strongest case to work on it now).

| Criterion | P1 Paid-certificate trust | P2 Application black hole | P3 Access friction |
|---|---|---|---|
| Frequency (24 mo) | 5 (74) | 4 (41) | 2 (16) |
| Severity | 5 (money lost) | 4 (wasted effort, no outcome) | 4 (blocked), but narrow |
| Evidence confidence | 5 | 4 | 3 |
| Students affected (evidence) | High; rising in 2026 | High in 2025; core to the "career" promise | Low–medium |
| Fixable in one week by an outside builder | **1**: billing, refunds, autopay consent, support SLAs; needs internal systems and policy, not a new AI product | **4**: a self-contained AI workflow can give instant, explained fit feedback | 2: needs Beep's app code and device repro |
| Product / growth impact | High (retention, ratings) | High: the core outcome; can connect to Beep's assessments as truthful gap-closers | Medium (activation) |
| **Total** | **21 + high impact** | **20 + high impact** | **13** |

## 5. Recommendation

**Build for P2. Escalate P1 to the founder's office as an operations issue.**

- P1 is the biggest and most urgent problem. But its fix is transparent pricing before the assessment, explicit autopay consent with in-app cancel, guaranteed certificate delivery, and a support SLA. An AI app would only put a layer on top of the real issue. I'm reporting it, not avoiding it.
- P2 is chosen because it is the core career outcome students come for, not because it's easy to code. The evidence shows a specific unmet need: **"tell me fast, honestly, and for free whether I fit this role and what to fix."** Beep's own slow, paywalled rejection report is the current workaround.
- **Why this matters for Beep:** an honest fit check shows which skills are missing for a real role. That is the truthful reason to take a Beep skill assessment. It links certification to outcomes instead of to pressure-pricing.

## 6. Still to do (needs you)

- [ ] **Install and use the app as a student** (needs your phone). Record onboarding, assessment pricing screens, and any job/internship workflow. Screenshots go in `evidence/app-screenshots/`. I have not installed or used the app.
- [ ] **Run 5–8 student interviews** with the script in `02-interview-kit.md` to validate P2 against P1. None have been done.
