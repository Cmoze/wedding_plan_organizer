# Usability test 008: 2026-11-09, track B helper

**Who:** a helper on the seeded demo wedding (Maya & Jordan), joined moments before this
session via a real accepted invite. First time using the app.
**How they plan today:** not asked this session.
**Who else is involved:** the couple and a planner, both already seeded on this wedding.
**How:** screen + audio recording, about 2:45. Live site (togetherwedding.vercel.app), the
seeded demo wedding (`npm run db:seed`), not a test wedding built for this sprint.
**Role in the test wedding:** helper, with two real tasks assigned ("Book the officiant,"
"Book the caterer").

**Important caveat on this session:** partway through, the browser's signed-in session
changed from this tester's real account to the platform admin account (`lib/admin.ts`) —
visible in the header badge switching names mid-recording. Asking Piper anything while
signed in as the admin returned a hard, unfriendly error: "You're not part of this
wedding." That's a real bug, but it's a gap in the admin feature I built, not something
this tester did — documented and fixed below, separately from the actual UX findings.

## What they did

| Step | Result | Time | What happened |
| ---- | ------ | ---- | -------------- |
| "What's assigned to you?" | Mixed | 0:00–0:45 | Checked Home first — "No tasks assigned to you this week." But they *do* have two assigned tasks; both are overdue (due Oct 18 and Oct 21), so "this week" apparently doesn't catch already-overdue assigned work. "I feel like it should [show something]" — right instinct, Home's card just doesn't surface overdue-but-assigned tasks. Went to Tasks instead and found both, tagged with their name, near the top of the due-date list. |
| Mark one done | Done, fast | 0:45–0:54 | Checked off "Book the officiant" without trouble. |
| Budget | Done, fast | 0:54–1:05 | "How much left in the budget? ... $2,800." Immediate, correct ($30,000 total − $27,200 planned). |
| Ask Piper | **Broken by my bug, not the app** | 1:09–1:35 | Asked "what are the colors again?" — got "You're not part of this wedding" instead of an answer. This is the session-identity-switch bug above, not a real Piper limitation. |
| Find the cake tasting | Stuck, gave up | 1:45–2:33 | Same pattern as 005 and 007: no event findable, eventually found a *task* ("Order the wedding cake," due Nov 19) and reported that instead. This wedding is the shared seed data, not something built for this sprint's tests, so — like 006 — this isn't fresh evidence of a product bug, just a reminder the seed data doesn't have a cake-tasting event either. |

Quotes:
- "I feel like it should [show my tasks]." (on Home's "no tasks this week" message)
- "You're not part of this wedding." (Piper's literal reply — my bug, not hers)
- "I don't know, I can't find it." (looking for the cake tasting)

## Where they got stuck

- **Piper 403 for the admin account, severity 3, now fixed:** `checkAiAccess`
  (`lib/ai/http.ts`) and the assistant route's separate `canEdit` lookup
  (`app/api/ai/assistant/route.ts`) both did a literal `members` row lookup with no
  fallback for the platform admin — unlike `app/page.tsx`, which already handles this.
  Fixed both to recognize the admin the same way the main page does.
- **Home's "this week" framing, severity 2:** a real, independent finding. Two tasks were
  genuinely assigned and genuinely overdue, but Home's "My tasks this week" card reported
  zero — technically defensible (they're not due *this* week, they're already *past* due),
  but it reads as "nothing's assigned to you," which is wrong in the way that matters to
  the person reading it.
- **Cake tasting:** not counted as new evidence — see 006's identical caveat about reused
  seed/test data with no cake-tasting event ever added.

## What to change

| # | Change | Severity | Evidence |
| - | ------ | -------- | -------- |
| 1 | (Already fixed) Admin account getting a 403 from Piper | 3 | "You're not part of this wedding" — a real, signed-in, authorized viewer |
| 2 | Have "My tasks this week" include overdue assigned tasks, not just ones due in the next 7 days, or relabel it so "nothing this week" doesn't read as "nothing assigned" | 2 | "I feel like it should [show something]" while two tasks were in fact assigned and overdue |

**Would they use it:** not asked this session.
**Biggest surprise (mine):** catching my own regression live, in someone else's test
session, the same day I shipped the feature that caused it.
