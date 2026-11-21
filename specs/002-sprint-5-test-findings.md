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

### Row 8 design (builder, 2026-11-20)

Mockup: `design/mockups/row-8-add-a-family.html` (open it in a browser). Picked from three
options (a switch on the existing card, a separate card, an invitation-first form), taking
the switch from the first, the button wording from the second, and the envelope preview from
the third.

**Add guests card.** "Add a guest" becomes "Add guests" with a switch at the top: **One
person** (today's form, unchanged) / **A family or group**.

**A family or group, names typed (default).**

- "Who's in it?": rows of first name + last name, starting with two. Each new row's last
  name is filled in from the row above. "+ Add another person" adds a row; ✕ removes one
  (not the first). The first person's first name is required; empty extra rows are ignored.
- Envelope preview beside the names (below them on a phone): the household name, the names
  ("Maria, Daniel and Sofia"), and "3 people · 1 invitation". It updates as you type.
- Household name is automatic: "The Lopez family" when everyone shares a last name,
  otherwise the existing envelope name ("Maria Lopez & Sam Chen"). "Edit name" lets you type
  your own; a typed name is kept as is.
- "Whose side?" and the optional mailing address, as on the one-person form.
- Button: **"Add the [last name] family"**, or "Add [n] people" when there's no shared last
  name.

**"Don't know everyone's names yet?"** switches the rows to: the first person's name
(required), then "How many others are coming with [first name]?" with − / + (1 to 20).
Placeholders are real guests named "[last name] guest 2", "guest 3"…, or "Guest 2"… with no
last name, so counts, RSVPs and meals work. The preview reads "Maria and 3 others". "Type
their names instead" switches back.

**Saving.** One submit creates the household and every guest together. If adding the guests
fails, the new household is removed, so nothing half-saved is left.

**Guest list (every household, not only new ones).**

- Each household shows **"N of M replied"** with a small bar; all replied turns green with a
  check. Replied means Coming or Not coming.
- Members are listed by name on one line. Only people who replied get a tag (Coming / Not
  coming); there is no per-person "No reply yet".
- Placeholder guests are greyed out with an "Add name" link (editors only) that renames them.
- Couple and planners get **"Update RSVPs"**, which opens today's per-person Coming / Not
  coming / No reply buttons (and remove), plus **"Mark everyone coming"**. Meals stay per
  person. Helpers see the totals and tags only, the same access they have today.

**Not in row 8:** the family typing their own names on the RSVP page (changes the public
RSVP page; propose separately).

**Done when (unchanged):** someone who hasn't seen the app adds three people as one household
in under a minute without help. Also: a family added by headcount shows up with the right
count on Guests and Home, and "Update RSVPs" still records each person.

## Progress

Checked on https://togetherwedding.vercel.app, in the role named.

| Row | Shipped | Checked on live | Result |
| --- | ------- | --------------- | ------ |
| 3 | 2026-11-16 (`b82a748`) | 2026-11-16, demo helper, pane at about 620 px and at 375 px | Pass. All 42 task rows have a checkbox; the 39 that aren't the helper's are locked, each with a reason; tapping one shows it. Known wart: the reason note covers the next row's title until you tap away. Builder review (2026-11-18): good. Added from that review, not yet live: every task row now says "Assigned to [name]", "Assigned to you", or "Unassigned", so a planner can see whose task they're checking off. |
| 4 | 2026-11-16 (`2b9c7f0`) | 2026-11-16, demo helper, same widths | Pass. Home listed the helper's three overdue tasks, marked "Overdue", and linked to Tasks → Assigned to me. The "assigned for later" wording was not seen live (no account in that state). Builder review (2026-11-18): looks good. |
| 6 | 2026-11-16 (`7f68e17`) | 2026-11-16, demo helper account | Pass. Created one wedding as Partner 2 and one as "Someone else": each member got the right name (Partner 2's name; the typed name) and the name was never asked for twice. Partner 1 uses the unchanged fall-back and was not re-tested. Follow-up fix, not yet live: choosing Partner 2 with that field empty used to clear the whole form with an error; the browser now stops the submit instead. |
| 6b | Migration `20261119030000_creator_role` applied to the dev project 2026-11-18; app code not yet live | Not yet. `npm run test:db` passes (23/23), including: a planner-created wedding has its creator as planner, that planner can invite as couple, and once the couple joins the planner's couple invite is refused. | Also built: Team's invite card becomes "Invite the couple" with Couple preselected while the wedding has no couple; Home shows an "Invite the couple" card to editors in that state. |
| 1, 5 | Folded into spec 003; live 2026-11-18 (`b042cc0`, `25e7eab`) | 2026-11-20, demo planner, pane at 575 px | Row 1 pass: the cake tasting is first under Appointments on Calendar, and Nov 27 has a maroon appointment dot while task and payment days are grey. **But** its time shows as 9:00 PM instead of 2:00 PM (see "Noticed while checking"). Row 5 pass for the rename: the demo wedding has "Plan the rehearsal dinner" and "Attend the rehearsal and rehearsal dinner", and new weddings get the new name. Row 5's Piper question still not asked on live. |
| 6b | Live 2026-11-18 (`ce3abff`) | 2026-11-20, demo planner, created a test wedding as "Someone else" | Creator side passes: the form says "You'll join as a planner and can invite the couple next"; Team lists the creator as Planner; Team's card is "Invite the couple" with Couple preselected; Home shows an "Invite the couple" card. Not checked: the couple accepting and getting full control (needs a second account). The test wedding is still in the dev project: its planner creator can't delete it (known gap). |
| Small fixes | Live 2026-11-18 | 2026-11-20, demo planner | Pass: every open task row in the demo wedding (36 of 36) says "Assigned to [name]", "Assigned to you" or "Unassigned". Pass: choosing Partner 2 with that name empty stops the submit with "Please fill out this field" and keeps the form. Pass: saving in "Edit task" closes the panel and shows the change. Not checked: "Get started" for a signed-in person with no wedding (the planner account has one). |
| 2 | Live 2026-11-20 (`662e5a0`) | Reproduced on live 2026-11-20 (Test Parent (QA), own task): after "Yes, check it off" the dialog closed and "Task checked off." appeared while the box was still empty and disabled for about 0.7 s; reopening did the same in reverse. Separately, after saving "Edit task", its "Assigned to" dropdown fell back to "No one" while the row said "Assigned to you", so a second save would have unassigned the task. Fixed locally (demo planner, 575 px): 5 check-offs and 4 reopens in a row, the box switched the moment the change was confirmed and never went back, and the row kept "Assigned to you"; after saving "Edit task" the dropdown kept the assignee. | Cause: the box waited for the refreshed page, but the notice didn't. Fix: `TaskStatusButton` shows the new state optimistically (`useOptimistic`) and closes the dialog on confirm; `EditTaskForm` is keyed on `updated_at` so it remounts with the saved values (React resets a form after its action, and a `<select>`'s `defaultValue` only applies on mount). The "Done" tag and strikethrough still follow about 0.5 s later, always forward. Also fixed: the row's details line was a `<p>` holding the due-date `<form>`, which made hydration fail for the whole Tasks page; now a `<div>`. |
| 7 | Live 2026-11-20 (`ae18b67`) | Locally, demo planner (laptop and 375 px): the card reads "What's next · 4 due in the next 30 days", a red "12 past due" link to the Past due filter, and "7 of 43 to-dos done or booked" under the bar. No sideways scroll, no console errors. | **Changed plan (builder, 2026-11-20): no phase tiles.** Since spec 003, new weddings start with only the to-dos the couple picks (7 in the live test wedding), so the 42-task scroll she described is gone for new weddings, and with few tasks per phase the tiles would mostly read "0 of 1". What a short list doesn't fix is her other complaint: "0 of 43 done" didn't say what to do. So the summary now leads with what's due in the next 30 days and what's past due, and the done count moves under the bar. Bring the tiles back if a tester with a long list still gets lost. |
| Live click-through | 2026-11-20, after `0a094c1` | Demo planner, pane at 575 px, 7:28 PM in Denver (already Nov 21 in UTC) | Row 2 pass: on the test wedding, 3 check-offs and 3 reopens in a row, sampled every 50 ms: each time the box switched once and never flipped back. Edit task pass: assigned a task, saved; the panel closed, the row said "Assigned to you", the dropdown kept the name, and a second save kept it. Row 7 pass: test wedding reads "What's next · 2 due in the next 30 days" and "1 of 9 to-dos done or booked". Times pass: the cake tasting shows "2p" and "2:00 PM" (also in the server's HTML, so no flash); Inbox shows 12:05 PM for an 18:05 UTC email. Piper pass: "What day and time is the cake tasting?" got "Friday, November 27, 2026, at 2:00 PM"; row 5's question got "Plan the rehearsal dinner", correctly unassigned. Database today pass: adding "Book the caterer" (date already past) gave it 2026-11-20, not UTC's 2026-11-21. Setup step pass: no "Pick a wedding date" on a dated wedding (setup and Browse suggestions), due-date field on "Add your own". Create form pass: "Create the wedding" for "Someone else", "Create our wedding" for Partner 1 or 2. `/about` signed in: "Open your wedding", no "Log in"; About copy says "Pick your to-dos…". Not checked: `/about` for a signed-in person with no wedding. |
| 9 | Live since Sprint 4 | 2026-11-20, demo planner, pane at 375 px | Pass as written: "Assigned to me (2)" sits in the Tasks summary card, visible without scrolling, and one tap shows only the planner's 2 tasks, each "Assigned to you"; no sideways scroll. **Wart:** after the tap nothing visible changes but the pill: the first task is about 1,580 px down, two screens below the fold, under "Tailor my checklist" and "Add a task". Someone who taps it on a phone may think it did nothing. **Fixed 2026-11-20 (`4034049`, `18dbff2`):** below the 1024 px laptop layout, filter links (and "N past due") jump to the list heading; on a laptop they change the filter in place (builder's call: no jump on computers). Checked on live at 375 px and 1280 px. Not checked as a helper (no helper login in the pane). |
| 8 | Built 2026-11-20, not yet live | Locally, as a couple/planner in the "Test Alex & Test Riley" test wedding, pane at 575 px: "A family or group" with Maria, Daniel and Sofia Testfam (last name carried down on "Add another person") showed "The Testfam family · Maria, Daniel and Sofia · 3 people" in the preview and saved with "Add the Testfam family" as one household, "0 of 3 replied". "Don't know everyone's names yet?" with Rosa Countfam + 3 saved Rosa and "Countfam guest 2–4", greyed with "Add name"; Invited went to 7. "Update RSVPs" → Coming on Rosa gave "1 of 4 replied" and a Coming tag; "Add name" renamed guest 2 to Leo Countfam; "Mark everyone coming" gave a green "✓ 4 of 4 replied" and Coming = 4. No console errors on a fresh load. | Built as in "Row 8 design". Stand-ins are recognised by name ("Lopez guest 2", no last name), not a new column, so no migration. A failed guest insert deletes the new household. Not checked: the helper view (no helper login), the 3-people-in-a-minute test with someone new, and `npm run test:db` (no DB test added for `addFamily`). Per-person email and phone now show only inside "Update RSVPs". Test families Testfam and Countfam are still in the test wedding. |
| 8 (live) | Live 2026-11-20 (`262b72b`) | 2026-11-20, demo planner in the test wedding, pane at 575 px | Pass: "A family or group" with Ana, Ben and Cal Rowtest showed "The Rowtest family · Ana, Ben and Cal · 3 people · 1 invitation", saved with "Add the Rowtest family" as one household ("0 of 3 replied"); Invited went 7 → 10. "Update RSVPs" → Coming on Ana gave "1 of 3 replied" and a Coming tag. **Gap:** the second row is there from the start, so a last name typed in row 1 afterwards isn't copied into it, and "Add another person" then copies row 2's empty last name. Typed in the natural order, the preview said "Ana Rowtest, Ben & Cal" and the button "Add 3 people" until both last names were typed by hand. **Fixed 2026-11-20:** row 1's last name now fills every later row whose last name wasn't typed by hand (checked locally: Maria Lopez, Daniel, + Sofia gave "Add the Lopez family"; a hand-typed "Chen" on row 2 stayed when row 1 changed), and the empty form's button reads "Add people" instead of "Add 0 people". Not checked: the headcount path on live, the helper view, the new-person test. |
| 10 | Live since Sprint 4 | 2026-11-20 | Pass. On live, Piper answered row 5's question with the right task and its (empty) assignee. Piper eval 25/26 on claude-opus-5-5 (target at least 23/25): only P-16 missed, the known flaky "I've set her up" wording (`product/evals/results/piper-2026-11-21T02-50-48.json`). |
| 11 | Live since Sprint 4 | 2026-11-20, demo wedding, Oct 2026, 1280 px and 375 px | Pass. Oct 23 has 11 items: the laptop grid shows 3 with "+8 more", and long titles elsewhere cut to "…"; clicking the day lists all 11 with full titles under the grid. On a phone the grid shows dots, and tapping the day shows its list right under the calendar (heading and first item on screen). |
| 12 | Live since Sprint 4 | 2026-11-20, every main page signed in, plus About, Log in, Sign up, Find an event | Pass. No "family and friends" in the code or on any page. "Family" appears only on Guests as one option ("a whole family", "a family or group", "a family or couple"). Registry's empty state said "so guests and family can find them all here"; reworded 2026-11-20 to "so guests can find them all here". |

### Noticed while checking (not yet scheduled)

- **Show password on Log in (builder, 2026-11-20):** add a show/hide toggle to the password
  field on the Log in page (and sign up), so people can see what they typed before submitting.
  **Done 2026-11-20:** a "Show" / "Hide" button inside the password field on Log in and Sign up.
- **Event times show in UTC (live check, 2026-11-20):** Calendar renders `LocalTime` on the
  server (UTC on Vercel), and `suppressHydrationWarning` keeps that text in the browser. In
  Denver, the cake tasting (seeded for 2:00 PM local) shows "9:00 PM" and "9p". The seeded
  events at 3:32 PM are seed-run time in UTC, so their times are off by the same amount.
  Affects anyone not in UTC.
- **About is out of date (live check, 2026-11-20):** it still says "A ready-made checklist,
  biggest decisions first" under Tasks, but new weddings now pick their own.
- **Setup step (live check, 2026-11-20):** "Add your own" has no due-date field, though spec
  003 says it should; custom to-dos are added with no date. "Pick a wedding date" is
  suggested even when the date was just entered. The form's button says "Create our wedding"
  even when "Someone else" is chosen.
- **`/about` header (live check, 2026-11-20):** the "Get started" fix covers `/` only; the
  `/about` page always shows the signed-out header ("Log in", "Get started" → /signup).
- **Database "today" is UTC (2026-11-20):** `add_template_tasks` dated past suggestions on
  `current_date` (UTC), so in the evening in the Americas they came out due tomorrow.

**Fixed 2026-11-20, live 2026-11-20 (`ae18b67`, `07fd4c7`, `0a094c1`):** all of the above except show
password. Times: the browser stores its zone in a `tz` cookie and the server shows event
times, event days, "today" and Piper's event times in it (`lib/time-zone.ts`); the cake
tasting shows 2:00 PM locally. About says "Pick your to-dos…". "Add your own" has an
optional due date (saved and shown on Tasks). "Pick a wedding date" is hidden once there's a
date. The button says "Create the wedding" for "Someone else". `/about` signed in shows
"Open your wedding" or "Get started" → /new-wedding, no "Log in". Migration
`20261121000000_add_template_tasks_today` (applied to dev 2026-11-20): the app passes the
viewer's today, trusted only within a day of the database's; `npm run test:db` 26/26.

### Test data to clean up

Left in the shared dev project by checks; it shows on the live site. Delete by hand (some
deletes use the browser's confirm dialog), then strike the line.

- "Flicker test (delete me)" task in Maya & Jordan (demo wedding), checked off.
- "Flicker test (delete me)" task in Test Alex & Test Riley.
- Testfam family (3) and Countfam family (4) in Test Alex & Test Riley, on Guests.
- The test wedding created as "Someone else" for row 6b: its planner creator can't delete it
  (known gap); needs the platform admin.

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
