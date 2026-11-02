# AGENTS.md

Shared instructions for every coding agent (Claude Code, Cursor, Codex, Copilot, Gemini, ...).
This is the single source of truth. Other agent files only point here.

## Project
Together (repo: wedding_plan_organizer): a web app for planning a wedding (guests, budget, vendors, timeline),
started at a hackathon by three contributors. Since Sprint 4 (2026-10-30) Carter builds it alone as an MSB 341
class product (`decisions/001-take-over-together.md`); commits still go straight to `main`.
Product work lives next to the code: `discovery/`, `design/usability-tests/`, `decisions/`, `specs/`, `gtm/`
(positioning in `gtm/positioning.md`) and `product/evals/` (Piper's eval sets). Sprint plans and reviews live in
the class repo, Cmoze/cmoser0_msb341. Specs go in `specs/` before the work.
Stack: responsive web app. Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase
(Postgres, Auth, Storage, Realtime), deployed on Vercel. Claude API for the AI helper.
The hackathon week plan, feature scope and design decisions are in `docs/PLAN.md` (history; still the best
description of what's built).

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
- Production build (what Vercel runs): `npm run build`
- Demo data in the shared dev project: `npm run db:seed` (`-- --reset` to recreate it)
- Per-role RLS tests against the dev project (not part of `npm test`): `npm run test:db`
- Regenerate DB types (B only, after a migration): `npm run db:types`
- Env vars: local values in `.env`; deployed values in Vercel (`vercel env ls`, `vercel env add <NAME> <env>`).
  When you add a variable, add its name to `.env.example` and set it in Vercel for production, preview and development.

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

## Ownership
- Carter owns everything now. During the hackathon the split was: Kai (frontend: `app/`, `components/`),
  Caleb (data model, auth, RLS, `lib/db/`, `supabase/migrations/`), Carter (integrations, Vercel, `app/api/`,
  `lib/email/`, `lib/ai/`). Kai and Caleb have stepped back.
- The Supabase dev project is still in Caleb's Supabase org; moving it to Carter's org is pending.
- Schema changes still go only through new migration files; ask the human before writing one.

## Backend (Supabase)
- One Supabase dev project (`wedding-plan-organizer-dev`, ref `iafqkveouictofowncpz`) backs local dev and the live
  site; its URL and keys go in `.env`.
- Schema changes live only as migration files in `supabase/migrations/`. Propose the change (fields, who can
  read/write) and get the human's OK before writing one; after `supabase db push`, run `npm run db:types` and
  commit migrations and types together. Don't edit RLS outside a migration.
- App code reads and writes data through functions in `lib/db/`, not ad-hoc queries in pages or routes.
- The service-role key is server-only (webhooks, AI routes). Never import it in client components or
  expose it with a `NEXT_PUBLIC_` prefix. Routes that use it bypass RLS, so check access in the route.
- After pulling new migrations or types, run `npm install` and restart `npm run dev`.

## Conventions
- Formatting: Prettier (with the Tailwind class-sorting plugin) plus `.editorconfig`. Markdown is not auto-formatted.
- Imports use the `@/` alias for the repo root (`@/components/ui/button`, `@/lib/utils`).
- Tests: Vitest, files named `*.test.ts(x)`, kept next to the code or in `tests/`.
- Folder layout:
  - `app/`: routes (App Router). `app/api/`: webhook and AI route handlers.
  - `components/`: app components; shadcn primitives in `components/ui/`.
  - `lib/db/`: data access, one file per area (`guests.ts`, `budget.ts`, ...); `lib/db/types.ts` is generated, don't edit.
  - `lib/db/supabase/`: client factories. `browser.ts` for Client Components, `server.ts` for Server
    Components/Actions/Route Handlers, `admin.ts` (service role, server-only) for webhooks and AI routes.
  - `lib/email/`, `lib/ai/`: inbound email and Claude helpers. `lib/utils.ts`: shared helpers (`cn`).
  - `proxy.ts`: Next 16's replacement for `middleware.ts`; refreshes the Supabase session.
  - `supabase/migrations/`: schema (B only). `scripts/`: setup, check, seed. `docs/`: plan and data model.
  - `tests/`: cross-cutting tests; `*.db.test.ts` hit the real dev project and only run via `npm run test:db`.
- Naming: files kebab-case (`guest-csv.ts`), React components PascalCase, functions camelCase,
  DB columns snake_case (keep them as-is in TS; don't remap).
- Data functions take the Supabase client as the first argument (`getGuestList(db, weddingId)`),
  so the same function works in the browser, on the server and in scripts.
- Error handling: `lib/db/` wraps Supabase results in `unwrap()`, which throws a `DbError`. Callers catch
  where they can show a message (UI) or return a status (API routes); don't swallow errors silently.
- Server-only modules start with `import "server-only";`.

## Lessons learned
<!-- When an agent makes the same mistake twice, add one line here. -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
