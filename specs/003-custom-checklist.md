# Spec 003: Custom checklist, picked from suggestions

**Status:** In progress (built, not yet live)
**Date:** 2026-11-18

## Progress (2026-11-18)

- Migration `20261119040000_custom_checklist` applied to the dev project. Since then, new
  weddings on the live site start empty; the setup step and Tasks panel go live with the app
  code.
- Checked locally (dev server against the dev database), as the demo planner:
  - Created a wedding as "Someone else", picked 2 suggestions, one whole phase (3) and 1 of
    my own: Tasks showed exactly those 6, with due dates counted back from the wedding date
    (past ones moved to today; the custom one had none). The renamed rehearsal task shows.
  - "Browse suggestions" on Tasks said 36 left; adding one made it 7 tasks and 35 left, and
    it stopped listing it.
  - Calendar, demo wedding: the cake tasting is a maroon "2p Cake tasting" chip on its day,
    first in the cell; Appointments lists it first; tasks are grey checkbox rows and payments
    `$` rows. At 375 px: maroon dots for appointments, grey for the rest, no sideways scroll.
- `npm run test:db` 25/25 (new: a new wedding starts empty, suggestions are added once with
  due dates, helpers and outsiders are refused). `./scripts/check.sh` passes.
- Not yet run: the Piper eval (unchanged code paths, but the checklist AI's prompt now says
  tasks were picked, not premade). Not checked: the setup step at 375 px, or "Skip for now".
- The test wedding was deleted afterwards. The demo wedding got the cake tasting event
  directly (the seed script has it too); the seed was not re-run.

## Problem

Every new wedding gets all 42 premade tasks (Decision 002). That causes three Sprint 4
findings: Tasks is one long list (007 #3, spec 002 row 7), premade tasks crowd real
appointments out of the Calendar (005 B6, spec 002 row 1), and two near-identical rehearsal
tasks sit in every wedding (005 #4, spec 002 row 5). It also means no couple's plan is their
own.

## What we're making

### 1. New weddings start with no tasks

`create_wedding` stops copying `checklist_templates` into `tasks`. The templates table stays
as the suggestion list. Existing weddings are not touched.

### 2. "Pick your to-dos" step after creating a wedding

After "Create wedding", the creator lands on `/new-wedding/checklist` instead of Tasks.

- Title: "Pick your to-dos". One line: "Here's what most couples plan. Add what fits yours,
  and write your own. You can add more any time from Tasks."
- Suggestions grouped by phase, using each template's `months_before`: "A year or more out"
  (12+), "6 to 11 months out", "3 to 5 months out", "The last two months", "The week of"
  (under 0.5). Each suggestion is a checkbox, **unchecked**.
- Each phase has "Add all in this phase" (checks every box in that phase; tapping again
  unchecks them).
- "Add your own": a text field and Add button; added items appear checked in a "Your own"
  group at the top. Optional due date.
- Footer: "Add N to-dos" (primary, disabled at 0) and "Skip for now" (quiet). Both go to Home.
- Due dates for suggestions are worked out the same way `create_wedding` did (wedding date
  minus `months_before`, never before today; none if there's no wedding date).
- Phone first: the footer stays pinned at the bottom on a 375 px screen.

Saving uses one new database function, `add_template_tasks(_wedding_id, _template_ids[])`,
so the due-date rule stays in one place and the insert is one round trip. Editors only
(couple or planner), checked inside the function. Custom items use the existing `createTask`.

### 3. "Browse suggestions" on Tasks

A panel on Tasks for couple and planners, closed by default, with the same phase groups. It
only lists suggestions the wedding doesn't have yet (no task with that `template_id`). On a
wedding with no tasks, the panel is open and Tasks says: "No to-dos yet. Pick from what most
couples plan, or add your own."

The existing AI "Personalized checklist" card keeps working; its `add_task` suggestions
become a normal custom task. Changing it to suggest from the template list is out of scope.

### 4. Events stand out on the Calendar (spec 002 row 1)

- "Coming up" splits into two cards: **Appointments** (upcoming events, the next 10, however
  far out) and **Due soon** (tasks and payments, as today).
- Each kind looks like what it is, in the app's own colors (builder's call, 2026-11-18). The
  "Task" / "Event" / "Payment" badges go away.
  - **Events (appointments):** a block in the app's pink and maroon (`#f4e7eb` background,
    `#6f1d37` left border and text), date and time on the left, title in bold, location
    under it.
  - **Tasks:** a plain row with a small empty checkbox in grey (`#806c74`), the title, and the
    due date on the right. No fill, so tasks sit quietly behind appointments.
  - **Payments:** like tasks, with a `$` in place of the checkbox and the amount due shown.
- In the month grid, each day lists events first, as solid maroon chips (`#6f1d37`, white
  text) that start with the time ("2p Cake tasting"). Tasks are grey text with a tiny
  checkbox; payments the same with `$`. An event never hides under "+N more". On phones,
  where the grid shows dots, events are maroon dots and tasks and payments grey.
- Seed data and the demo wedding get a "Cake tasting" event, and spec 002 row 1 is re-run:
  as a planner, find its date from Calendar in under 30 seconds without search.

### 5. Row 5's rename, smaller

The template "Rehearsal and rehearsal dinner" is renamed "Attend the rehearsal and rehearsal
dinner" in the same migration. Existing weddings whose task still has the old title get the
new one. (Spec 002 row 5.)

## Migration (needs the builder's OK before it's written)

One migration:

1. Replace `create_wedding` (same 7-argument signature) without the `insert into tasks`.
2. Add `public.add_template_tasks(_wedding_id uuid, _template_ids uuid[]) returns setof
   tasks`, security definer, raises unless the caller can edit the wedding, skips templates
   the wedding already has.
3. Rename the rehearsal template and matching unchanged task titles.

Then `npm run db:types`; seed script updated so the demo wedding picks its tasks through the
new function and gains the cake tasting event.

## Out of scope

- Changing or removing tasks already in existing weddings.
- Editing the suggestion list in the app (it stays a migration-managed table).
- Reworking the AI Personalized checklist.
- Spec 002 row 7's overview tiles: re-check once this ships; a short custom list may make
  them unnecessary.

## Definition of done

- [ ] Create a wedding, pick 5 suggestions and 1 of your own: Tasks shows exactly those 6, with
      due dates; Home and Calendar show them.
- [ ] "Skip for now" leaves Tasks empty, with the suggestions panel open.
- [ ] "Browse suggestions" on Tasks adds one more and stops listing it.
- [ ] A helper can't add suggestions (no panel; the function refuses).
- [ ] As a planner in the demo wedding, find the cake tasting from Calendar in under 30
      seconds without search.
- [ ] `./scripts/check.sh` and `npm run test:db` pass (new tests for `add_template_tasks`);
      Piper eval still scores at least 23/25.
- [ ] Shipped and checked on https://togetherwedding.vercel.app on a laptop and at 375 px.
- [ ] How we'll know it worked: in the next user test, a couple sets up their checklist
      without help and can say what they'll do first.
