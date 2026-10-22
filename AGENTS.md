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
- Install: `npm install` (run again after any pull that changes `package.json`)
- Dev server: `npm run dev` (http://localhost:3000)
- Auto-format: `npm run format`. Single steps: `npm run lint`, `npm run typecheck`, `npm test`
- Add a shadcn component: `npx shadcn@latest add <name>` (lands in `components/ui/`)

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
- Role A, Frontend / UI (Kai): `app/` pages, `components/`, layout, styling.
- Role B, Data model + auth + roles (Caleb): `supabase/migrations/`, RLS policies, generated types, `lib/db/`.
- Role C, Integrations (Carter): repo tooling, Vercel, `app/api/` webhook and AI routes, `lib/email/`, `lib/ai/`.
- Changing the database schema is B's call; propose changes to B instead of editing migrations yourself.

## Conventions
- Formatting: Prettier (with the Tailwind class-sorting plugin) plus `.editorconfig`. Markdown is not auto-formatted.
- Imports use the `@/` alias for the repo root (`@/components/ui/button`, `@/lib/utils`).
- Tests: Vitest, files named `*.test.ts(x)`, kept next to the code or in `tests/`.
- Folder layout: `app/` routes, `components/` (shadcn primitives in `components/ui/`), `lib/` server and shared code.
- Naming, error handling: TBD.

## Lessons learned
<!-- When an agent makes the same mistake twice, add one line here. -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
