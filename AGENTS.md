# AGENTS.md

Shared instructions for every coding agent (Claude Code, Cursor, Codex, Copilot, Gemini, ...).
This is the single source of truth. Other agent files only point here.

## Project
Together (repo: wedding_plan_organizer): a web app for planning a wedding (guests, budget, vendors, timeline),
started at a hackathon by three contributors. Since Sprint 4 (2026-10-30) Carter builds it alone as an MSB 341
class product (`decisions/001-take-over-together.md`). Carter is the only human; the "teammates" now are
several agent sessions running at once, so the git rules below are about keeping sessions out of each
other's way.
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
- Check everything before finishing: `./scripts/check.sh` (formatter check + lint + typecheck + tests).
  It does not run the production build; the pre-push hook and `./scripts/land.sh` do.
- Install: `npm install` (run again after any pull that changes `package.json`, then restart the dev server:
  a running `next dev` keeps the old versions loaded)
- Dev server: `npm run dev` (http://localhost:3000). Port 3000 is usually Carter's own server, started in
  his terminal: don't stop it. In a worktree, use `npm run dev -- -p 3001` (any of 3001-3009).
- Parallel work: `./scripts/worktree.sh new <name>`, then `./scripts/land.sh` (see "Parallel sessions").
- Auto-format: `npm run format`. Single steps: `npm run lint`, `npm run typecheck`, `npm test`
- Add a shadcn component: `npx shadcn@latest add <name>` (lands in `components/ui/`)
- Production build (what Vercel runs): `npm run build`
- Demo data in the shared dev project: `npm run db:seed` (`-- --reset` to recreate it)
- Per-role RLS tests against the dev project (not part of `npm test`): `npm run test:db`
- Regenerate DB types (after a migration): `npm run db:types`
- Env vars: local values in `.env`; deployed values in Vercel (`vercel env ls`, `vercel env add <NAME> <env>`).
  When you add a variable, add its name to `.env.example` and set it in Vercel for production, preview and development.

## Git workflow (main deploys)
- A push to `main` deploys the live site (https://togetherwedding.vercel.app, Vercel project
  `cmoze/togetherwedding`). Agents push only when Carter says to.
- Run `git pull --rebase` before starting work and again right before pushing.
- Commit small pieces with clear messages.
- NEVER force push (`git push --force` / `--force-with-lease`). It can erase another session's work.
- Never rewrite history that is already on `main` (no rebasing pushed commits, no amend after push).
- When resolving merge conflicts, preserve both sides' intent. If unsure, stop and ask the human.
- After a push, confirm the deploy: `vercel ls` shows Ready or Error; for Error,
  `vercel inspect <deployment-url> --logs`. Then load the changed page on the live site.

## Parallel sessions
Several agent sessions often work on Together at the same time. When they shared the one checkout in
`../together`, they tripped the pre-commit hook on each other's unfinished files, edited the same spec
under each other, and pushed between each other's commit and push. So:
- **One writer per checkout.** A session that will change files starts its own worktree:
  `./scripts/worktree.sh new <short-name>` makes `../together-wt/<short-name>` on branch `wt/<short-name>`
  from the latest `origin/main`, with `.env` and `node_modules` copied. Work, test and commit there.
- **The main checkout (`../together`) stays clean on `main`.** Use it only for reading, quick one-file fixes
  when no other session is writing, and `git pull`. If `git status` there shows changes you didn't make,
  another session is working: don't commit, stash, reset or reformat them; start a worktree instead.
- **Land with `./scripts/land.sh`.** It rebases on the latest `origin/main`, runs `check.sh` and the
  production build. `./scripts/land.sh --push` then pushes to `main` (only with Carter's OK) and pulls the
  main checkout forward. Afterwards remove the worktree: `./scripts/worktree.sh remove <short-name>`.
- **Commit only your own files.** `git add <paths>`, never `git add -A` / `git add .` in a shared checkout.
- **Specs and other shared Markdown:** pull right before editing, keep edits to your own row or section,
  and commit them soon so other sessions see them.
- **Dev servers:** each worktree runs its own on 3001-3009; the browser pane's sign-in is per port.
- **Who's doing what:** before starting, say which spec row or file you're taking, so Carter (and other
  sessions reading the repo) can see it.

## Rules
- Run `./scripts/check.sh` and make it pass before saying a task is done.
- Don't edit files outside the scope of the task.
- Don't add dependencies without telling the human, and mention them in the commit message.
- Never commit secrets. Use `.env` (copy `.env.example`); `.env` is gitignored.
- Keep changes small. If a task needs a huge diff, stop and propose splitting it.

## Ownership
- Carter owns everything. Kai and Caleb (hackathon contributors) have stepped back.
- The Supabase dev project is still in Caleb's Supabase org; moving it to Carter's org is pending. Until then
  the Supabase MCP tools can't query it (permission denied): check data through the app or `npm run test:db`.
- Schema changes go only through new migration files; ask the human before writing one.

## Testing in the browser
- Local and live both use the one shared Supabase dev project, so local tests write real data that the live
  site shows.
- Agents never type passwords into a sign-in form, not even demo ones: ask Carter to sign in in the browser
  pane. The pane is shared by every session, so whoever signs in last decides the account and wedding; check
  the header's wedding name before testing.
- Demo logins (seeded by `npm run db:seed`): `couple@`, `planner@`, `helper@demo.wedding`; the password is
  `DEMO_PASSWORD` in `scripts/seed.mts`. Their wedding is Maya & Jordan; keep it presentable (it's the demo).
- Throwaway data goes in the test wedding "Test Alex & Test Riley" (account "Test Parent (QA)"; Carter has its
  password, it isn't in the repo), named so it's easy to spot: "(delete me)" or a "Test…" last name.
- Some deletes use the browser's own confirm dialog, which agents can't click. List anything left behind in
  the current spec's "Test data to clean up" section instead of leaving it in chat.

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
  - `supabase/migrations/`: schema. `scripts/`: setup, check, seed, worktree, land. `docs/`: plan and data model.
  - `design/mockups/`: static HTML mockups referenced from specs (open in a browser; not app code).
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
- `cacheComponents` is on: anything that reads cookies, the session or other per-visitor data must render
  inside `<Suspense>`, or `next build` fails prerendering that page (2026-11-20, `/about`). `check.sh` and
  `next dev` don't catch it; the build does.
- Never put a `<form>` (or `<div>`, `<details>`) inside a `<p>`: the browser splits the `<p>` and hydration
  fails for the whole page (2026-11-20, task rows).
- React resets a form after its action runs, and a `<select>`'s `defaultValue` only applies on mount. Key edit
  forms on the row's `updated_at` so they remount with saved values (2026-11-20, "Assigned to" fell back to
  "No one").
- A Next.js security advisory can stop `next build` outright (`SecurityFatalError`). Upgrade within the same
  minor (`npm install --save-exact next@<fixed> eslint-config-next@<fixed>`) after Carter's OK; don't run
  commands the error message suggests on its own.
- Show a change's new state optimistically (`useOptimistic`) when the confirmation toast would otherwise
  appear before the refreshed page does (2026-11-20, task checkbox).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
