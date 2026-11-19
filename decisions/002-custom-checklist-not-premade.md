# Decision 002: New weddings start with an empty checklist and pick from suggestions

**Date:** 2026-11-18
**Status:** Active

## Context

Every new wedding gets all 42 premade checklist tasks, each with a due date counted back from
the wedding date. Three Sprint 4 test findings trace back to that:

- 007 #3: Tasks is "one long list" with no way to see it all at once.
- 005 B6: the planner scrolled the Calendar's "Coming up" twice and saw "task items only,
  into 2027". Premade tasks crowd out real appointments.
- 005 #4: two premade tasks ("Plan the rehearsal dinner" and "Rehearsal and rehearsal
  dinner") read as the same job, and both are in every wedding.

The premade list also works against the positioning: every couple's plan is meant to be their
own, but every plan starts identical.

## Options considered

1. **Keep the 42 premade tasks, fix the symptoms** (overview tiles, events filter, a rename).
   Pros: no change to setup; first-timers get a full plan without effort. Cons: the wall of
   tasks stays, and every wedding still carries tasks the couple never chose.
2. **Start empty; suggestions start checked** (untick what you don't want). Pros: fast for
   first-timers. Cons: clicking Next gives you today's 42 tasks, so it isn't really custom.
3. **Start empty; suggestions start unchecked, picked at setup and any time later.** Pros:
   only tasks the couple chose; a short list is easy to see whole. Cons: more taps for someone
   who wants most of them; a couple who skips the step has an empty plan on day one.
4. **Start empty; suggestions only on the Tasks page.** Pros: setup stays short. Cons: easy
   to miss, and Home, Calendar and Piper are empty until someone finds it.

## Decision

Option 3. Deciding reason: the plan should hold only what this couple chose to do. The
suggestions still teach first-timers what's normal, but nothing is added for them. To keep the
cost down, the step has "Add all in this phase" per phase, a field to write your own, and
"Skip for now"; Tasks keeps a "Browse suggestions" panel for later.

Existing weddings keep the tasks they have.

## What would change our mind

- In the next user tests, couples skip the step and then can't say what to do next, or
  Home/Piper feel empty enough that they leave.
- Most couples press "Add all" on every phase, which would mean option 2 (checked by default)
  saves them the taps.
