# Usability test 006: 2026-11-09, track B wedding party (helper)

**Who:** a friend of the couple, helping as a member of the wedding party. First time
using the app.
**How they plan today:** not asked this session.
**Who else is involved:** the couple (Sydney/Carter test wedding), plus the planner from
test 005.
**How:** screen + audio recording, about 6:15. Run against the live site
(togetherwedding.vercel.app), on the real Sydney & Carter test wedding used in 001.
**Role in the test wedding:** helper.

**Important caveat on this session:** partway through, I (the builder, working with Claude
Code) assigned two tasks to this tester's pending invite a few seconds **after** he had
already accepted it in real time — a race condition, not something he or the app did
wrong. Because a task only gets promoted from a pending invite to a real assignee at the
moment the invite is accepted, those two tasks silently never linked to him. That
directly caused the worst stretch of this session (B2/B3 below). It's fixed now (the
tasks were manually pointed at his real member record), but the session itself ran while
broken, so B2/B3's severity reflects a bug in how *I* used the feature, not the feature
itself — documented in `005`'s sibling PR on `lib/db/weddings.ts`-adjacent code, not here.

## What we asked them to do

The Track B script from `000-test-plan.md`, reordered slightly by whoever was reading it
(budget asked before "what's assigned"), followed by one positioning question
(own-login). The full positioning section and wrap-up weren't run this session.

## What they did

| Task | Result | Time | What happened |
| ---- | ------ | ---- | -------------- |
| B1 | Done, fast | 0:00–0:20 | Invite page correctly showed "As a helper you can add ideas and photos, comment, and update tasks assigned to you," pre-filled his name, auto-saved a password. No hesitation. |
| B4 | Done, fast | 0:30–0:41 | "How much is left in the budget? We have $9,600 left out of $10,000" — immediate, correct. |
| B2 | **Blocked** (my bug, see caveat) | 0:41–2:39 | Went to Tasks, saw all 41 checklist items but none tagged as his. Tried refreshing, said "maybe I messed something up," eventually gave up looking for an assigned task specifically and just read the general "next up" list instead. ~2 minutes lost to a task-assignment bug on my end, not the app. |
| B3 | **Blocked**, correctly | 2:39–3:25 | Tried to check off "Book the band or DJ" (not actually his) — couldn't: "I see the tasks, but I can't access them." This is the app working as designed (helpers can only check off their own tasks). Worth noting: Home's "My tasks this week" card does say "No tasks assigned to you this week" clearly — it's specifically the Tasks checklist page where a non-owned task's checkbox is just an empty blank space (confirmed in `components/wedding/sections/checklist.tsx`: `canUpdate` false renders a plain spacer, no disabled state or explanation). |
| B5 | Done, worked well | 3:39–4:14 | Asked Piper about the band/DJ budget. Piper answered precisely: total budget, how much is unassigned, the open "Book the band or DJ" task and its due date, no vendor or emails on file yet, and suggested asking the couple or planner once a number exists. |
| B6 | **Could not evaluate** — test setup gap | 4:14–5:33 | No cake tasting event exists on this wedding's calendar at all (unlike the parent-track test wedding in `005`, this one was originally set up for the Track A couple test and never got a cake tasting added). He checked the calendar grid (no event dot anywhere) and the task list, found a *task* called "Order the wedding cake" and reasonably assumed that was the ask, confusing a tasting (an event) with ordering (a task) — a mix-up a real cake-tasting event probably would have prevented, but not evidence either way since nothing to find actually existed. |

**Piper:** Two questions, both strong answers grounded in real plan data (see B5 above, and
a follow-up asking when the cake is being ordered — "checklist says January 26, 2027. Cake
hasn't been ordered yet, because the task isn't complete.").

Quotes:
- "I see the tasks, but I can't access them."
- "Maybe I messed something up."
- "It's not even on here." (looking for the cake tasting)

## Positioning

Only one question was asked before the session ended:
- **Own logins for helpers:** "I think it's easier to just sign in yourself" — a clear,
  confident yes, unprompted hedging either way.

## Where they got stuck

- **B2/B3, severity 3, but attributable to a build-process bug, not the product:** see the
  caveat above. The two tasks meant for him never linked to his account because of a
  timing mistake when they were assigned, after he'd already joined.
- **B3's blank checkbox, severity 2 (real, independent of the above):** on the Tasks
  checklist page specifically, a non-owned task's checkbox area is an empty blank space —
  no disabled styling, no tooltip. Someone in his exact situation (legitimately, no bug
  involved) would have no way to tell "not mine" apart from "broken."
- **B6, severity n/a this session:** the gap was in test-wedding setup, not the app —
  flagging only so this wedding isn't reused for a B6 test again without fixing that.

## What to change

Ranked, most important first. Severity: 3 = blocked a task, 2 = slowed them down or
confused them, 1 = a wish.

| # | Change | Severity | Evidence (task, quote) |
| - | ------ | -------- | ----------------------- |
| 1 | On the Tasks checklist, show *something* (disabled checkbox, tooltip) for a task that isn't the viewer's, instead of a blank space | 2 | B3: "I see the tasks, but I can't access them" — the checkbox area was just empty, no disabled state |
| 2 | (Process, not product) Never assign a task to a pending invite without first checking it hasn't just been accepted | 3 | Caused B2/B3's entire ~2-minute stall this session; already fixed in code review for `005`/`006`'s supporting work |

**Would they use it:** not asked (session ended after the one positioning question).
**Biggest surprise (mine):** watching my own mistake play out in someone else's real
session in real time — exactly the kind of thing a test recording catches that a changelog
doesn't.
