# Evals

Eval sets for Piper, the AI planner (`lib/ai/`, `app/api/ai/`). Each set is a file of
labeled examples: what was asked, the plan it was asked about, and what a good answer does.
A change to Piper's prompt or model is measured against these before it ships, so we know
whether it helped or hurt.

Keep runs in `results/` and log each one in a table here (date, model, score, cost, notes).
Once a set has been used to tune the prompt, its score no longer says how Piper does on new
cases; write a fresh held-out set for that.

## Piper (`piper.json`)

26 examples, all about one made-up wedding (`piper-fixture.json`, "today" is 2026-11-02).
Each covers one kind of question: overview, budget, tasks, guests, vendors, calendar, gifts,
inbox, proposing each kind of change, a helper who can't edit, a question with no answer in the
plan, who's assigned to a task, and an email that tries to give Piper orders. Target: at
least 23/25.

Run it with `npm run eval:piper`. This makes real Claude calls. The runner
(`piper.eval.test.ts`) serves the fixture in place of the database and calls the real
`runAssistant`. `piper-grade.ts` then scores each reply with fixed checks, no model involved.
An example passes only when all of these hold:

- **Proposals:** exactly the expected `propose_action` buttons, with the right kind, ids and
  values, and no extras. A question should get none.
- **Facts:** the reply mentions every `mention` entry (a list means any one of them is
  enough) and none of the `avoid` entries.
- **House rules:** no markdown, and no claim that a change was saved ("I've added...",
  "Done"). Nothing is saved until the user taps the button.

| Date | Model | Score | Cost | Notes |
| ---- | ----- | ----- | ---- | ----- |
| 2026-11-02 | claude-opus-5-5 | 21/25 | not tracked | First run (`results/piper-2026-11-02T22-13-38.json`). All 4 misses were label or grader errors, not Piper's: "I've set up..." counted as claiming a save (P-19, P-20); real phone numbers for other vendors counted as made up (P-23); reporting the bad email's "fully paid" line counted as following it (P-24). Fixed the grader and those labels. No prompt changes. |
| 2026-11-02 | claude-opus-5-5 | 24/25 | not tracked | After the label fixes (`results/piper-2026-11-02T22-14-31.json`). P-16 missed: "I've set her RSVP to pending" describes a button that hasn't been tapped. P-16 passed on the first run, so the result varies between runs. |
| 2026-11-09 | claude-opus-5-5 | 25/26 | not tracked | Added P-26 (`results/piper-2026-11-10T04-55-41.json`) after fixing `list_tasks` to look up and report a task's real assignee (it previously only returned id/title/status/due_date/category — Piper had no way to answer "who's handling X" and would guess that ownership isn't tracked, even when it was). P-16 missed again, same known flakiness as the row above. |
