# Usability test 007: 2026-11-09, track B friend (planner)

**Who:** a friend of the couple, given planner-level access (full edit). First time using
the app.
**How they plan today:** not asked this session.
**Who else is involved:** the couple (Sydney/Carter test wedding), the builder narrating
tasks over FaceTime screen share, and a third person present but not driving.
**How:** remote, FaceTime screen share recorded locally, about 7:35. Live site
(togetherwedding.vercel.app), the same Sydney & Carter test wedding as 001 and 006.
**Role in the test wedding:** planner (full edit access — different from 006's helper).

## What we asked them to do

A reduced Track B set (B2/B3 combined, B4, B5, then a substitute for B6 — "find out when
they are going wedding dress shopping" instead of the cake tasting, since this wedding
has no cake-tasting event — see 006's same caveat), plus one open-ended positioning
question ("what's one thing you'd change or add?").

## What they did

| Task | Result | Time | What happened |
| ---- | ------ | ---- | -------------- |
| B2/B3 | Slow, real friction | 0:21–2:20 | "Find the tasks assigned to you" sent her straight to the Tasks nav item, which shows all 43 checklist items with no way to isolate or highlight hers. She scanned, unsure: "There should be ones that say your name on them... but I could be wrong." She eventually gave up looking for *her* task specifically and demonstrated the "mark done" flow on an arbitrary one instead. **Her two actual tasks were correctly assigned the whole time** (confirmed in the database — this was not the same bug as 006) — the friction was purely that nothing on the Tasks page surfaces "yours" out of a long, due-date-sorted list. |
| (aside) | Explored, positive | 1:28 | Found "Tailor my checklist" on her own and tried it — Piper suggested context-aware tasks grounded in the wedding's real numbers (e.g. "Add a task to decide how to fit 300 guests into a $10,000 budget — that's about $33/guest, which is very tight"), each with a "Yes, add it" / "No thanks" button. She accepted at least one; this is why the task count was 43, not 41. Worked well, unprompted discovery. |
| B4 | Done, fast | 3:06–3:21 | "How much is left on the budget? ... Oh, right there. $9,600." Immediate. She later called this "the easiest thing to find." |
| B5 | Done | 3:29–4:12 | Had to ask who Piper was first ("Oh, Piper — I'm like, who's Piper?"), then asked a question and got an answer (not narrated in detail, but no errors). |
| B6 (substitute) | Done, roundabout | 4:12–5:12 | Went to Calendar, paged through months one at a time (November → ... → January) looking at the day-grid, where task titles are truncated ("Book the cat...", "Book the off...") and unreadable without guessing. Backed out, scrolled the Calendar's **"Coming up" list** instead (full, untruncated titles) and found "Shop for the wedding dress or suit — Nov 26, 2026" there. The month grid is where the friction is; the list view underneath it isn't. |

Quotes:
- "There should be ones that are like, say your name on them — I'm not wrong." (looking for her tasks)
- "[The calendar] says book the off, book the, decide on the — I don't know what that is actually." (truncated day-grid titles)
- "The budget was the easiest thing to find — because there's a budget." [on the Budget page specifically]
- "That whole [tasks] page is a little bit wonky to me."

## Positioning

Only the open-ended "what would you change" question was asked:
- **Tasks:** wants an overview/grid view she can "zoom out" on instead of a long scrolling
  list — "so then you can see all of it instead of having to scroll down and being like,
  wait, what do I need to do."
- **Calendar:** wants a search bar, specifically because tapping into a busy day only
  shows truncated task names she can't make sense of ("it says book the off, book the,
  decide on the... I don't know what that is actually").
- Confirmed unprompted that Budget was the easiest page to use.
- Repeated, on her own, that the Tasks page specifically "is a little bit wonky" and that
  "0 of 43 done" didn't make sense to her at a glance.

## Where they got stuck

- **Finding "my tasks," severity 3, now seen in 3 of 3 remote sessions (005, 006, 007):**
  every tester who was asked "what have they asked you to do" went to the Tasks nav item
  and scanned a long, undifferentiated, due-date-sorted list looking for their name,
  rather than using Home's "My tasks this week" card (which does show assigned tasks
  clearly — see 006). Nobody has found that card on their own yet. This is the single
  most consistent finding across all three sessions so far.
- **Calendar month-grid truncation, severity 2, confirmed independently twice (005's
  screenshot, now 007's direct feedback):** day cells show cut-off task titles with no way
  to expand them in place; the "Coming up" list one scroll down has the same information
  fully readable, but nothing points a confused user there.

## What to change

Ranked, most important first, folding in the pattern from 005/006. Severity: 3 = blocked a
task, 2 = slowed them down or confused them, 1 = a wish.

| # | Change | Severity | Evidence (task, quote) |
| - | ------ | -------- | ----------------------- |
| 1 | Make "my tasks" easy to find from the Tasks page itself (filter, sort-to-top, or a visible prompt pointing at Home's existing "My tasks" card) | 3 | Seen in 005, 006, and this session: "there should be ones that say your name on them... I'm not wrong" |
| 2 | Either don't truncate task titles in the calendar's day-grid cells, or make a truncated title expandable/tappable in place | 2 | "It says book the off, book the, decide on the — I don't know what that is actually"; she had to abandon the grid for the "Coming up" list instead |
| 3 | Give the Tasks page some kind of overview/grid view, not just one long scrolling list | 1 | "Make a way where you can see all the tasks at once... so you're not scrolling down being like, wait, what do I need to do" |

**Would they use it:** not asked this session.
**Biggest surprise (mine):** her two tasks actually were assigned correctly the entire
time (unlike 006) — this was a clean, bug-free read on a real findability gap, not noise
from the earlier race condition. That makes it the strongest evidence yet that "my tasks"
needs its own visible home on the Tasks page.
