# Wedding Plan Organizer: Hackathon Plan

The shared week plan. Check items off (`- [x]`) as you finish them and push, so everyone can see progress.

## The idea
One shared **wedding workspace** that the couple, parents and wedding party all join. Built for the parent
who keeps plans on paper, loses details, and has information spread across texts, emails and notebooks.

**Goal:** simple UI, easy collaboration, everything in one place.

**Stack:** responsive web app. Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase
(Postgres, Auth, Storage, Realtime), deployed on Vercel. Claude API for the AI helper.

## Features and scope
| Priority | Features |
|---|---|
| Must have | Workspace + invites/roles, tasks with premade checklist, calendar view, budget, guest list (households + CSV import), home dashboard |
| Should have | Ideas boards (photos + comments), activity feed, receive-only wedding inbox |
| Stretch | AI helper (checklist + email parsing), sending email, registry links, photo-of-handwritten-list import |

Design decisions:
- **Tasks, calendar and "what's already planned" share one data model.** A task has a status
  (todo / in_progress / done / booked); "already planned" is a filtered view of done + booked; the calendar
  shows anything with a date (tasks, events, budget payment due dates).
- **Guests are grouped by household**, since invitations go to addresses.
- **Wedding email = a dedicated inbound address per wedding** (`<slug>@<inbound-domain>`) received through an
  email provider webhook. People can also forward vendor emails to it. Receive-only first; sending is a stretch goal.
- **Registry = saved links** (Amazon has no public registry API).
- **AI never writes automatically.** It suggests ("Add $500 deposit due Nov 3?") and a person accepts.

Roles inside a wedding: **couple** (full control), **planner/parent** (edit everything), **helper**
(view, comment, update tasks assigned to them).

---

## Day 0: All three together (about 1 hour)
- [ ] Each person clones the repo and runs `./scripts/setup.sh`
- [ ] Create the Supabase project (dev) and the Vercel project; add all three people to both
- [ ] Agree on the data model (B drafts it, everyone reviews)
- [ ] Write the demo script together (the 2–3 minute story you'll show the judges)
- [ ] Fill in names in the Ownership section of `AGENTS.md`

---

## Role A (Kai): Frontend / UI
*Owns: `app/` pages, `components/`, layout, styling, the overall user experience.*

**Days 1–2: App shell and design basics**
- [x] Set up Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (coordinate with C, who sets up the repo)
  - Done by C. `app/` and `components/` already exist with create-next-app / shadcn starter files (`app/page.tsx`, `app/layout.tsx`, `components/ui/button.tsx`). They're placeholders: replace them freely.
- [ ] App shell: navigation with Home, Tasks, Calendar, Budget, Guests, Ideas, Inbox; works on phones (bottom tab bar or hamburger menu)
- [ ] Design basics for parents: large base font (≥16–18px), high contrast, big tap targets, plain labels
- [ ] Auth screens: sign up, log in, "create your wedding" (names, date, rough budget, guest count)
- [ ] Mock data file shaped exactly like B's schema, so screens can be built before the database is ready

**Days 2–4: Core screens**
- [ ] **Home dashboard**: countdown, "my tasks this week", overdue items, budget summary, "already booked" list, recent activity
- [ ] **Tasks**: list grouped by timeframe (12 months out, 6 months out…), filter by assignee/status, add/edit form, assign to a member, check off
- [ ] **Calendar**: month view plus "upcoming" list view; shows task due dates, payment due dates and events; tap to open the item
- [ ] **Budget**: category totals, line items (estimated / actual / paid / due date), budget-vs-spent bar, link to a vendor
- [ ] **Guests**: households with address, guests inside each, RSVP status, side, meal choice; search and filters; counts (invited / attending)

**Days 4–5: Collaboration screens and wiring**
- [ ] **Ideas boards**: category grid → board → photo grid → photo detail with comments and 👍
- [ ] **Members/invite screen**: list members and roles, "invite" button that copies a link
- [ ] **Activity feed** component (used on Home)
- [ ] Swap mock data for B's real Supabase queries, screen by screen
- [ ] Show/hide edit buttons based on the user's role

**Days 6–7: Polish**
- [ ] Empty states ("No guests yet — import a spreadsheet or add one")
- [ ] Loading and error states, toasts after saves
- [ ] Print-friendly CSS for guest list, budget and checklist
- [ ] Test on a real phone and run through the demo script for rough spots

---

## Role B (Caleb): Data model, auth and roles
*Owns: `supabase/migrations/`, Row Level Security policies, generated types, data-access functions in `lib/db/`.*

**Day 1: Data model (top priority, everyone waits on this)**
- [ ] Draft the tables and relationships, share them, get sign-off from A and C:
  - `weddings` (names, date, budget total, inbound email slug)
  - `members` (user ↔ wedding, role: couple / planner / helper, display name)
  - `invites` (wedding, token, role, expires)
  - `tasks` (title, notes, category, due date, status: todo / in_progress / done / booked, assignee, vendor link)
  - `events` (calendar items that aren't tasks: shower, rehearsal, fittings)
  - `vendors` (name, type, contact, phone, email, status)
  - `budget_items` (category, description, estimated, actual, paid, due date, vendor link)
  - `households` (name on envelope, address fields, side) → `guests` (name, RSVP, meal, plus-one, child?)
  - `idea_boards` → `idea_items` (photo path, caption, link) → `comments` (shared across ideas and tasks) → `reactions`
  - `emails` (from, subject, body, received at, linked items)
  - `activity` (who did what, when)
  - `registry_links` (store name, URL)
- [ ] Decide the **checklist template** format (seed table or JSON file of ~40 standard tasks with "months before wedding" offsets)

**Days 1–2: Database and security**
- [ ] Migrations for every table, with foreign keys, indexes on `wedding_id`, and `created_at`/`updated_at`
- [ ] **Row Level Security on every table**: only members of a wedding can see its rows; helpers can read, comment and update only tasks assigned to them; couple/planner can edit everything
- [ ] Generate TypeScript types (`supabase gen types`) and commit them; rerun after every schema change
- [ ] Seed script with a realistic demo wedding (guests, tasks, budget, ideas), used by A's screens and the demo

**Days 2–3: Auth and collaboration plumbing**
- [ ] Supabase Auth with email + password and/or magic link (magic link is easiest for parents)
- [ ] "Create wedding" function: makes the wedding, adds the creator as `couple`, copies the checklist template into `tasks` with due dates calculated from the wedding date
- [ ] Invite flow: create token → open link → sign up/log in → join with that role
- [ ] Storage bucket for idea photos, with access rules matching table permissions

**Days 3–5: Data-access layer and features**
- [ ] `lib/db/` functions A can call: `getTasks`, `createTask`, `updateTaskStatus`, `getBudgetSummary`, `getCalendarItems` (merges tasks, events and budget due dates), etc.
- [ ] **CSV guest import**: parse, map columns, group by address into households, preview before saving
- [ ] Guest list CSV export (for envelopes / mail merge)
- [ ] Activity logging (database triggers or calls inside each write function)
- [ ] Realtime subscriptions for tasks and comments, so collaborators see changes live

**Days 6–7: Hardening**
- [ ] Log in as each role and confirm permissions block what they should
- [ ] Run Supabase security/performance advisors and fix what they flag
- [ ] Reset and reseed the demo data before presenting

---

## Role C (Carter): Integrations (deploy, email inbox, AI)
*Owns: repo setup/tooling, `app/api/` routes for webhooks and AI, `lib/email/`, `lib/ai/`, environment variables.*

**Day 1: Foundation (unblocks everyone)**
- [x] Set up the Next.js project in the repo (coordinate with A on structure)
- [x] Fill in `scripts/check.sh`: Prettier check, ESLint, `tsc --noEmit`, Vitest
- [ ] `.env.example` with every variable name (Supabase URL/keys, email provider key, Anthropic key); real values only in `.env` and Vercel settings
- [ ] Connect Vercel to the repo: automatic deploys from `main`, preview URLs, environment variables set
  - Connected: https://wedding-plan-organizer.vercel.app (project `cmoze/wedding-plan-organizer`). Environment variables still to add once Supabase exists.
- [ ] Update `AGENTS.md`: commands, folder layout, conventions

**Days 2–4: Wedding email inbox**
- [ ] Choose the inbound provider (Postmark, Mailgun or Resend inbound) and test receiving one email
- [ ] Address scheme: each wedding gets `<slug>@<inbound-domain>`
- [ ] Webhook route `app/api/inbound-email`: verify the provider's signature, find the wedding by address, save to `emails`, store attachments in Supabase Storage
- [ ] Inbox screen (pair with A): list, read view, "link to vendor/task/budget item" action
- [ ] Forwarding instructions shown in the app ("Forward any vendor email to smith-jones@…")
- [ ] **Stretch:** sending/replying (needs a domain plus SPF/DKIM setup; only if time allows)

**Days 4–6: AI helper (Claude API)**
- [ ] Server-only `lib/ai/` wrapper; the API key is never sent to the browser
- [ ] **Email → actions**: pull out dates, amounts, vendor names and to-dos from an incoming email; show "Add $500 deposit due Nov 3 to budget + calendar?" with accept/dismiss
- [ ] **Personalized checklist**: tweak the template based on date, guest count and budget
- [ ] **"What should we do this week?"** summary on the dashboard, built from overdue and upcoming tasks
- [ ] **Stretch:** photo of a handwritten list → guests or tasks, with a preview before saving
- [ ] Rate limiting and graceful failure (the app must work fine when AI is down)

**Days 6–7: Registry and demo readiness**
- [ ] Registry section: saved links (Amazon, Target, Zola) with store name and notes
- [ ] Production deploy works end to end with seeded data
- [ ] Prepare the demo email ahead of time so the "email → calendar" moment works reliably

---

## Hand-off points
| When | Who → who | What |
|---|---|---|
| Day 1 | B → A, C | Schema + generated types (A builds mocks to match, C knows where emails go) |
| Day 1 | C → A, B | Working repo, `check.sh`, Vercel deploys |
| Day 3 | B → A | `lib/db/` functions ready to replace mocks |
| Day 4 | C ↔ A | Inbox and AI suggestion UI |
| Day 6 | Everyone | Feature freeze → polish + demo practice |
