# AGENTS.md

Shared instructions for every coding agent (Claude Code, Cursor, Codex, Copilot, Gemini, ...).
This is the single source of truth. Other agent files only point here.

## Project
Wedding Plan Organizer: a hackathon app for planning a wedding (guests, budget, vendors, timeline).
Three contributors, each using a different coding agent, all pushing directly to `main`.
Stack: responsive web app. Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase
(Postgres, Auth, Storage, Realtime), deployed on Vercel. Claude API for the AI helper.
The week plan, feature scope and per-role to-do lists live in `docs/PLAN.md`. Read it before starting a task,
and check items off there when you finish them.

## First-time setup (required after cloning)
- Run `./scripts/setup.sh` once in every new clone. It enables the git hooks (`.githooks/`),
  sets `pull.rebase=true`, and creates `.env` from `.env.example`.
- If `git config core.hooksPath` doesn't print `.githooks`, setup hasn't been run: run it before doing anything else.

## Commands
- Check everything before finishing: `./scripts/check.sh` (formatter check + lint + typecheck + tests)
- Install / dev: TBD once the stack is chosen.

## Git workflow (we push straight to main)
- Run `git pull --rebase` before starting work and again right before pushing.
- Commit small pieces with clear messages; push small and often.
- NEVER force push (`git push --force` / `--force-with-lease`). It can erase a teammate's work.
- Never rewrite history that is already on `main` (no rebasing pushed commits, no amend after push).
- When resolving merge conflicts, preserve both sides' intent. If unsure, stop and ask the human.

## Rules
- Run `./scripts/check.sh` and make it pass before saying a task is done.
- Don't edit files outside the scope of the task.
- Don't add dependencies without telling the human, and mention them in the commit message.
- Never commit secrets. Use `.env` (copy `.env.example`); `.env` is gitignored.
- Keep changes small. If a task needs a huge diff, stop and propose splitting it.

## Ownership (avoid editing the same files at once)
- Role A, Frontend / UI (name: TBD): `app/` pages, `components/`, layout, styling.
- Role B, Data model + auth + roles (name: TBD): `supabase/migrations/`, RLS policies, generated types, `lib/db/`.
- Role C, Integrations (name: TBD): repo tooling, Vercel, `app/api/` webhook and AI routes, `lib/email/`, `lib/ai/`.
- Changing the database schema is B's call; propose changes to B instead of editing migrations yourself.

## Conventions
- Formatting follows `.editorconfig`; add the stack's formatter config when chosen.
- Folder layout, naming, error handling, testing patterns: TBD.

## Lessons learned
<!-- When an agent makes the same mistake twice, add one line here. -->
