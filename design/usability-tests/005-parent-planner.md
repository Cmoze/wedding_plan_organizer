# Usability test 005: 2026-11-07, track B parent (planner)

**Who:** [fill in: a parent helping with a wedding — relationship to the couple, how they plan
today, whether they've done this before]
**How they plan today:** [fill in from warm-up — notebook, spreadsheet, app, group text]
**Who else is involved:** [fill in]
**How:** screen recording, laptop (Microsoft Edge), about 11 minutes
**Role in the test wedding (track B):** planner

**Note on this write-up:** built from a silent screen recording (no audio), sampled frame by
frame. There's no transcript of what she said out loud, so quotes, the warm-up answers, and
the positioning reactions below are gaps — fill them in from memory or notes if you have them.

## What we asked them to do

The Track B script from `000-test-plan.md`, tasks B1–B6, followed by the positioning
questions on `/about`.

## What they did

| Task | Result | Time | What happened |
| ---- | ------ | ---- | -------------- |
| B1 | Done, with friction | 0:23–1:36 | The invite email landed in Outlook's Junk Email folder. Opening it triggered a "Junk Email Security" interstitial ("links... will not work automatically") that she had to click through ("Visit Link") before the invite worked. The invite page correctly offered planner access and pre-filled her name. |
| B2 | Done, roundabout | 1:35–2:59 | After joining she didn't check Home or Tasks first — she went to Ideas → Flowers and browsed photo boards for about 90 seconds before finding her assigned tasks under the Tasks nav item. |
| B3 | Done, but UI looked broken | 2:59–3:42 | Checked off "Book the caterer," then also checked off "Plan the rehearsal dinner" (did both of her two tasks, not just one as asked). Both times, right after the green "Task checked off." toast appeared, the checkbox rendered empty/unchecked and "Assigned to" briefly showed "No one" instead of her name. |
| B4 | Done, fast | ~4:00 | Found "Left to plan: $15,000" immediately at the top of the Budget page, no scrolling needed. |
| B5 | Done, worked well | 4:48–5:52 | Typed and abandoned "What hotel," then asked Piper "Who is in charge of the flowers?" and "Who is in charge of the rehearsal dinner?" Piper gave specific, grounded answers (named the booked venue, said no florist was saved, offered to add a "Book a florist" task) and offered to add the rehearsal dinner to the calendar once she had details. |
| B6 | Stuck, gave up | 6:08–7:44 | Scrolled the Calendar's "Coming up" list twice (task items only, into 2027) and checked the November 2026 month grid — no cake tasting visible either place. Abandoned the search and moved to the Wedding Inbox instead. |

**Piper:** Asked two real questions (see B5). The flowers answer referenced actual plan data
(venue, checklist) and offered concrete next steps. The rehearsal dinner answer was wrong:
Piper said "I can't find anyone named as in charge of the rehearsal dinner... your planner
doesn't record who owns each task" — but the "Plan the rehearsal dinner" task she had just
checked off a minute earlier was assigned to her, "Cynthia Rasmussen," visible right in the
task's own UI. Piper didn't check the assignee field at all, it seems, and told her
information didn't exist when it did. It also treated "Plan the rehearsal dinner" (done, hers)
and "Rehearsal and rehearsal dinner" (not done) as two separate, unrelated items without
flagging the near-identical names.

Quotes: none available (no audio).

## Positioning

`/about` was never opened on screen during the recording (it ends at 11:04, mid-session, on
the Registry page) — either this part happened after the recording stopped, or wasn't
reached. Fill in from memory/notes if you have them:

- **What they said it is:**
- **Didn't fit them:**
- **Zola / The Knot:**
- **Own logins for helpers:**
- **Vendor ads and suggestions:**

## Where they got stuck

- **B6, severity 3 (blocked the task):** couldn't find the cake tasting via either the
  Calendar's "Coming up" list (tasks only, not events) or the November grid. Unclear whether
  the event was actually seeded into this test wedding or genuinely hard to find — check the
  test wedding setup before counting this against the app.
- **B5, severity 3 (wrong answer, not just unhelpful):** asked Piper who's in charge of the
  rehearsal dinner; Piper said the app "doesn't record who owns each task," but the task was
  assigned to her and the assignee was visible in the task UI she'd just used. This is the
  exact scenario B5 tests ("something you'd normally have to text the couple about") and Piper
  got it wrong rather than just not knowing.
- **B3, severity 2 (confusing, not blocking):** checking off a task shows a success toast but
  the checkbox and assignee both appear to reset visually right after.
- **B1, severity 2 (friction before the task could start):** invite email landed in Junk,
  with an extra security click-through before the link worked.

## What to change

Ranked, most important first. Severity: 3 = blocked a task, 2 = slowed them down or confused
them, 1 = a wish.

| # | Change | Severity | Evidence (task, quote) |
| - | ------ | -------- | ----------------------- |
| 1 | Make Piper check the task's own "Assigned to" field before saying ownership isn't recorded | 3 | B5: told her "your planner doesn't record who owns each task" for a task assigned to her |
| 2 | Make the cake tasting (or any calendar event) findable from the Calendar page, not just tasks | 3 | B6: scrolled "Coming up" twice and checked the month grid, never found it, gave up |
| 3 | Fix the checkbox/assignee flicker after checking off a task | 2 | B3: checkbox shows empty and "Assigned to: No one" right after the "Task checked off." toast |
| 4 | Don't name two different tasks "Plan the rehearsal dinner" / "Rehearsal and rehearsal dinner" | 2 | Piper's answer under B5 treated them as separate items; easy to confuse |
| 5 | Say "the people helping you," not "family and friends," on the Home page invite card | 1 | Seen on Home at ~1:34 — conflicts with gtm/positioning.md's own language rule |

**Would they use it:** [fill in from wrap-up]
**Biggest surprise (mine):** Piper gave a wrong answer, not just a limited one — it denied
having information (task ownership) that was sitting right in the task's own assignee field,
on the exact kind of question ("who's handling X") Piper exists to answer.
