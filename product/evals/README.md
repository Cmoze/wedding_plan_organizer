# Evals

Eval sets for Piper, the AI planner (`lib/ai/`, `app/api/ai/`). Each set is a file of
labeled examples: what was asked, the plan it was asked about, and what a good answer does.
A change to Piper's prompt or model is measured against these before it ships, so we know
whether it helped or hurt.

Keep runs in `results/` and log each one in a table here (date, model, score, cost, notes).
Once a set has been used to tune the prompt, its score no longer says how Piper does on new
cases; write a fresh held-out set for that.
