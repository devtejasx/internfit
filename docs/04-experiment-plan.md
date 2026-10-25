# Seven-Day Experiment Plan (Phases 4–5)

**Status: designed, not run.** Every number in the results table is empty until real sessions happen. Targets are not observations.

## Hypothesis
If a student can get an honest, explained fit check before applying, most students who start will leave with an application output they actually use (copy). They will also spend less time preparing than they usually do.

## Primary metric: task completion rate
**Definition:** of unique sessions that fire `workflow_started` (focusing a field, or tapping the sample), the share that also fire `output_copied` at least once.

`completion rate = sessions with ≥1 output_copied ÷ sessions with workflow_started`

The `/stats` page computes this automatically (per cohort, too).

**Why copy, not "analysis shown":** copying means the student took the output into a real application or notes. Viewing a result is too weak a signal.

**Target: ≥ 60% in the moderated cohort, ≥ 35% in the unmoderated cohort.**
*Justification:* the brief suggests 70%. In moderated sessions the student is asked to do the task, so completion will be inflated. In unmoderated traffic, any session that focuses a field counts as "started" (including curious bounces), so 70% is not realistic. Pasting a resume on a phone is real friction. There is no baseline for this exact tool, so these targets are set to be revisited after day 2.

## Secondary metrics
| Metric | Source | Target |
|---|---|---|
| Analysis success rate (`analysis_completed ÷ analysis_requested`) | events | ≥ 95% |
| Error rate (`workflow_failed ÷ analysis_requested`), by code | events | ≤ 5% |
| Median time from start to first copy | `output_copied.elapsedSec` | ≤ 5 min |
| Rated useful (4–5 of 5) | feedback | ≥ 70% of responders |
| Would use before a real application = "yes" | feedback | ≥ 50% |
| Time saved (self-reported) | `usualMinutes` − (time to first copy ÷ 60), per responder, median | > 15 min |

## Baseline
There is no historical data. Collect a baseline in moderated sessions **before** showing the tool:
1. Ask: "Show me how you'd prepare an application for this internship using what you normally use." Give them 10 minutes max.
2. Record: minutes taken, whether they produced a tailored message (Y/N), and whether they could name ≥2 of their gaps for the role (Y/N).
3. Then run the same task with InternFit and record the same three things.

The self-reported `usualMinutes` in the feedback form is a second, weaker baseline for unmoderated users.

## Audience and recruitment
- **Who:** UG students at Tier 2/3 colleges who have applied to (or plan to apply to) an internship in the last 3 months.
- **Moderated cohort (`?c=mod`):** 8–12 students over video call or in person. Recruit via your college and batch WhatsApp groups, juniors, and your TPO. Do this with consent, using the script in `02-interview-kit.md`.
- **Unmoderated cohort (`?c=wa`, `?c=li`):** share the link with a one-line ask in 3–5 student WhatsApp groups you're already in, plus one LinkedIn post. Each channel gets its own `c=` code so results can be split.
- **Do not** buy traffic, use fake accounts, or ask friends to "just click copy".

## Consistent test task (moderated)
Every student does the same task: "Here is a real internship description [pick one public listing relevant to their branch]. Use InternFit to decide whether to apply. If you would apply, prepare what you'd send." The student uses their own experience text. Note the listing URL and date in the session log.

## Instrumentation (implemented)
| Event | Fired when | Metadata (whitelisted, no text) |
|---|---|---|
| `workflow_started` | first focus on either field, or "Try with a sample" | cohort |
| `analysis_requested` | submit passes validation | cohort |
| `analysis_completed` | valid AI result shown | fitBand, latencyMs |
| `workflow_failed` | any API/network/timeout failure | errorCode |
| `output_copied` | any copy button succeeds | section, elapsedSec |
| `output_edited` | first edit of a section | section |
| `feedback_submitted` | feedback form sent | rating, wouldUse, usualMinutes, elapsedSec |

The server rejects any key not on the whitelist. Resume and job text never reach analytics.
**Review/export:** `/stats` (needs `STATS_KEY`) shows the metric tiles, and "Download CSV" exports every event.

**Caveat:** a session that used the sample data counts as started. In moderated sessions, tell students not to use the sample. Unmoderated sample-only sessions will lower completion. Report this as a limitation.

## Feedback questionnaire
**In-app:**
- usefulness 1–5
- would you use it before a real application (yes/maybe/no)
- usual minutes (optional)

**Moderated follow-up (verbal, record verbatim):**
1. What, if anything, would you change in what you send now?
2. Was anything in the output wrong or untrue about you?
3. What would stop you from using this again?

## Sample-size limitation
At n≈10 moderated students, a 60% observed completion rate has a 95% confidence interval of roughly 31–83% (Wilson). That only supports **directional** conclusions. Unmoderated numbers depend on channel mix. No result from this week is statistically conclusive. Report counts alongside every percentage.

## Day plan
| Day | Activity |
|---|---|
| 1 | Deploy. Smoke-test on 2 phones. Run 2 pilot moderated sessions. Fix friction. |
| 2 | 3–4 moderated sessions. Revisit the targets. |
| 3–5 | Post unmoderated links (one channel per day). 3–5 more moderated sessions. |
| 6 | Freeze data, export the CSV, code the verbatims. |
| 7 | Analyse and write up results and the decision. |

## Results table (fill with real data only)
| Metric | Target | Moderated (n=) | Unmoderated (n=) | Notes |
|---|---|---|---|---|
| Task completion rate | 60% / 35% | | | |
| Analysis success rate | ≥95% | | | |
| Error rate | ≤5% | | | |
| Median time to first copy | ≤5 min | | | |
| Rated useful (4–5) | ≥70% | | | |
| Would use = yes | ≥50% | | | |
| Median time saved (self-report) | >15 min | | | |
| Baseline: tailored message produced | — | __/__ without → __/__ with | n/a | |
| Baseline: could name ≥2 gaps | — | __/__ without → __/__ with | n/a | |

## Decision rule (day 7)
- **Continue and scale:** moderated completion ≥ 60%, useful ≥ 70%, no student reports invented facts. Next steps: pilot inside Beep, then measure application → shortlist rate (the real outcome).
- **Change:** completion 35–60%, or useful < 70%. Find the drop-off step from the events (start → requested → completed → copied) and fix the biggest one. Re-run for 7 days.
- **Stop or pivot:** completion < 35% moderated, **or** ≥2 students report the output invented qualifications, **or** students say they would not change who or how they apply. Go back to the P1/P2 evidence.
