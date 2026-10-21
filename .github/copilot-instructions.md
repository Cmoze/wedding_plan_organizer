# Copilot instructions

Follow the instructions in AGENTS.md at the repo root. It is the single source of truth.

Key rules (copied from AGENTS.md):
- After cloning, run `./scripts/setup.sh` once (enables git hooks, sets pull.rebase, creates `.env`).
- Run `./scripts/check.sh` and make it pass before finishing.
- We push straight to `main`: `git pull --rebase` before starting and before pushing; never force push.
- Don't edit files outside the task's scope; don't add dependencies silently.
- Never commit secrets; use `.env` (see `.env.example`).
