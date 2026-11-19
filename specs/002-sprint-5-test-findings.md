# Spec 002: Fix every finding from the Sprint 4 user tests

**Status:** In progress
**Date:** 2026-11-16

## Problem

Five people tested Together in Sprint 4 (`design/usability-tests/001`, `005`, `006`, `007`,
`008`). Their write-ups list 12 distinct product changes. Five shipped in Sprint 4, but as
quick patches; seven haven't been touched. Sprint 5's goal is every finding checked off in
the live app and demoed.

Not counted: the two findings that were the builder's own bugs and are already
fixed (006 #2, assigning a task to an invite that had just been accepted; 008 #1, Piper
refusing the platform admin).

## What we're making

Each finding gets a fix and a "done when" check. The check is run on the live site, signed
in as the role the tester had.

### Still open (7)

| # | Finding | Source | Sev | Fix | Done when |
| - | ------- | ------ | --- | --- | --------- |
| 1 | A calendar event (the cake tasting) can't be found | 005 #2 | 3 | Add a cake-tasting event to the seed data and the test wedding, then reproduce B6. If events are missing from "Coming up" or the month grid, show them in both. | As a planner, find the cake tasting's date from the Calendar page in under 30 seconds, without search. |
| 2 | Checkbox looks empty and "Assigned to" shows "No one" right after checking off a task | 005 #3 | 2 | Reproduce first (planner, own task, Edge and Chrome). Fix so the row never shows a state that is neither the old one nor the new one. | Check off a task 5 times in a row: the checkbox and assignee never flash back. |
| 3 | A helper sees a blank space where the checkbox would be on tasks that aren't theirs | 006 #1 | 2 | Show a greyed-out checkbox with a short reason on hover, tap, and for screen readers: "Only [assignee] or a planner can check this off" (or "Not assigned to you" if no one has it). | As a helper, every task row shows a checkbox; ones that aren't mine look disabled and say why. |
| 4 | Home says "No tasks assigned to you this week" when assigned tasks are overdue | 008 #2 | 2 | The Home card lists overdue assigned tasks first, marked "Overdue", then this week's. If the viewer has assigned tasks only further out, say so ("Nothing due this week. 2 tasks assigned to you later.") and link to Tasks → Assigned to me. | As a helper with two overdue tasks and none this week, Home shows both. The card never implies nothing is assigned when something is. |
| 5 | Two premade tasks have near-identical names | 005 #4 | 2 | Rename the day-before task from "Rehearsal and rehearsal dinner" to "Attend the rehearsal and rehearsal dinner" in the checklist template (new migration), and in existing weddings where the title is unchanged. | A new wedding's checklist has no two titles that read as the same job. Asking Piper "who's in charge of the rehearsal dinner?" names the planning task's assignee. |
| 6 | "Your name" on the wedding-creation form caused hesitation | 001 #3 | 1 | Replace the free-text field with a choice: "Which one are you?" → Partner 1 / Partner 2 / Someone else (then a name field). | Creating a wedding as Partner 1 never asks for the same name twice. |
| 7 | Tasks is one long list with no way to see it all at once | 007 #3 | 1 | An overview at the top of Tasks: one tile per checklist phase with done / total and overdue count; tapping a tile jumps to that phase. Also reword "0 of 43 done", which she said didn't make sense at a glance. | On a laptop, the whole checklist's state is visible without scrolling. |

### Shipped in Sprint 4, to re-check (5)

| # | Finding | Source | Sev | What shipped | Done when |
| - | ------- | ------ | --- | ------------ | --------- |
| 8 | "How do I add a family?" | 001 #1 | 3 | Field renamed to "Household". **Reopen:** a rename doesn't answer the question she asked. Add an "Add a family or group" path on Guests: one household name, several people, one submit. | Someone who hasn't seen the app adds three people as one household in under a minute without help. |
| 9 | Can't find "my tasks" on the Tasks page | 007 #1 | 3 | "Assigned to me" filter. | As a helper or planner, get from the Tasks page to only my tasks in one tap; the filter is visible without scrolling on a phone. |
| 10 | Piper said task ownership isn't recorded | 005 #1 | 3 | Piper looks up the real assignee. | The B5 question gets the right name on the live site; the Piper eval still scores at least 23/25. |
| 11 | Calendar day-grid titles are cut off | 007 #2 | 2 | Search, and titles wrap to two lines. | In a month with a busy day, every title is readable in the grid or one tap away. |
| 12 | "Family and friends" copy | 001 #2, 005 #5 | 2 | Copy replaced. | No signed-in or signed-out screen says "family and friends"; "family" appears only as one example among several. |

The sprint plan says 11 findings. The write-ups have 13 product rows; merging the two copy
rows (row 12) leaves the 12 here. This spec covers all 12.

### Added from the builder's review (2026-11-18)

| # | Finding | Source | Fix | Done when |
| - | ------- | ------ | --- | --------- |
| 6b | Someone who isn't a partner creates the wedding and becomes **couple**: full control, listed as one of the couple, can delete the wedding | Builder review of row 6 | When "Which one are you?" is "Someone else", they join as **planner** instead. After creating, Home's first card says "Invite the couple" and links to Team's invite form. | A parent creates a wedding, shows on Team as planner, invites the couple as couple, and the couple accepts and has full control. Creating as Partner 1 or 2 still makes you couple. |

**Why not a role picker:** a helper (view, comment, own tasks) can't add guests, budget, or
tasks, so a helper who creates a wedding couldn't set it up. "Someone else" always means
planner; if they're really a helper, the couple can change their role on Team later.

**The catch:** only the couple can invite someone as couple (RLS policy "editors can create,
only couple can invite couple" on `invites`). A wedding created by a planner has no couple,
so nobody could ever invite them.

**Migration (needs the builder's OK before it's written):**

1. `create_wedding` gets `_role public.member_role default 'couple'`. Allowed values are
   `couple` and `planner`; anything else raises. The member insert uses `_role`. Replacing
   the function drops and re-creates it with the new signature (the old 6-argument version
   must not linger), then `npm run db:types`.
2. New `private.has_couple(_wedding_id)`: true if any member of the wedding has role `couple`.
3. Replace the invite insert policy: an editor may invite as couple if they're couple **or
   the wedding has no couple yet**. Once a couple member exists, it's couple-only again.
4. No change to who can delete the wedding or change roles (still couple only). Known gap:
   a planner-created wedding that the couple never joins can't be deleted by its creator
   from the app; the platform admin can.

**App:** `createWeddingAction` passes `role: "planner"` when `who === "other"`;
`createWedding` in `lib/db/weddings.ts` passes it through. The form's "Someone else" option
gets one line under it: "You'll join as a planner and can invite the couple next."

**Tests:** RLS/DB tests (where the existing ones live) for: a planner-created wedding has the
creator as planner; that planner can invite as couple; after a couple joins, the planner's
couple invite is refused.

## Progress

Checked on https://togetherwedding.vercel.app, in the role named.

| Row | Shipped | Checked on live | Result |
| --- | ------- | --------------- | ------ |
| 3 | 2026-11-16 (`b82a748`) | 2026-11-16, demo helper, pane at about 620 px and at 375 px | Pass. All 42 task rows have a checkbox; the 39 that aren't the helper's are locked, each with a reason; tapping one shows it. Known wart: the reason note covers the next row's title until you tap away. Builder review (2026-11-18): good. Added from that review, not yet live: every task row now says "Assigned to [name]", "Assigned to you", or "Unassigned", so a planner can see whose task they're checking off. |
| 4 | 2026-11-16 (`2b9c7f0`) | 2026-11-16, demo helper, same widths | Pass. Home listed the helper's three overdue tasks, marked "Overdue", and linked to Tasks → Assigned to me. The "assigned for later" wording was not seen live (no account in that state). Builder review (2026-11-18): looks good. |
| 6 | 2026-11-16 (`7f68e17`) | 2026-11-16, demo helper account | Pass. Created one wedding as Partner 2 and one as "Someone else": each member got the right name (Partner 2's name; the typed name) and the name was never asked for twice. Partner 1 uses the unchanged fall-back and was not re-tested. Follow-up fix, not yet live: choosing Partner 2 with that field empty used to clear the whole form with an error; the browser now stops the submit instead. |
| 6b | Migration `20261119030000_creator_role` applied to the dev project 2026-11-18; app code not yet live | Not yet. `npm run test:db` passes (23/23), including: a planner-created wedding has its creator as planner, that planner can invite as couple, and once the couple joins the planner's couple invite is refused. | Also built: Team's invite card becomes "Invite the couple" with Couple preselected while the wedding has no couple; Home shows an "Invite the couple" card to editors in that state. |
| 1, 5 | Folded into spec 003 (2026-11-18), built, not yet live | Locally: the demo wedding's cake tasting is the first item on its day, as a maroon chip, and first under Appointments. The rehearsal template and existing tasks are renamed "Attend the rehearsal and rehearsal dinner". | The test wedding never had a cake tasting (checked the database); row 1's real problem was premade tasks crowding the Calendar. Row 5's Piper check still to do on live. |

## Order

1. Rows 3, 4, 6: small, one file each.
2. Rows 1, 2: reproduce, then fix. Row 1 includes the seed-data change.
3. Rows 5 and 6b: migrations, after the builder's OK.
4. Rows 7, 8: design work.
5. Rows 9–12: re-check on the live site; fix whatever fails.
6. Walk every row on the live site and record the demo.

## Out of scope

- New user tests. Row 8's "someone who hasn't seen the app" is one informal check, not a
  written-up session.
- Invite emails landing in Junk (005 B1): a deliverability problem, not in the write-up's
  change list.
- Password-manager popups over the signup form (001 A1): the browser's, not ours.
- Any change to roles or what a helper is allowed to do.
- A full redesign of Tasks beyond the overview tiles.

## Definition of done

- [ ] Every row's "Done when" passes on https://togetherwedding.vercel.app, in the role
      named, on a laptop and a phone (375 px)
- [ ] `./scripts/check.sh` passes; the Piper eval scores at least 23/25
- [ ] Shipped: each fix is on `main` and live
- [ ] A recorded demo walks all rows in order
- [ ] How we'll know it worked: one person who hasn't used the app does A3 (add a family)
      and B2 (find your tasks) without getting stuck
