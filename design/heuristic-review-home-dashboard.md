# Heuristic review: Home dashboard (A1–A6), 2026-11-10

**Source:** another AI service's read of screenshots/description of the Home dashboard,
against the Track A script (`usability-tests/000-test-plan.md`). Not a recorded human
session — no one actually did these tasks for this review. Keep separate from the
`usability-tests/NNN-*.md` files, which are all real people's recorded behavior.

**How to use this:** each point below is a claim to check, not a confirmed finding. Where
I could check it against this session's own evidence (screenshots or writeups from the
real tests), I've noted whether it held up. Points I couldn't check are unverified either
way — test them for real before acting on them.

## Points raised

**A1 — wedding date banner vs. past-due setup tasks**
Claim: the dashboard shows the wedding date (Aug 27, 2027) while "Needs Attention" lists
setup tasks (set budget, draft guest list, pick a date) as past-due, which could read as
contradictory — "didn't I just do this?"
**Status:** unverified. Plausible on its face (all starter-checklist due dates are set
relative to signup day, so everything looks "overdue" immediately on a fresh wedding —
noted independently in 001's "What to change" table), but no real tester has reacted to
this specific juxtaposition on camera yet.

**A2 — "No tasks assigned to you this week" vs. multiple other task sections**
Claim: Home shows several different task groupings at once (My Week, Next little steps,
Needs Attention, Past-due), which could make "what should I do" ambiguous.
**Status:** related to a real, now well-evidenced finding — three separate testers (005,
006, 007) went to the Tasks page instead of Home and then couldn't find what was
assigned to them there. This review's point about Home's multiple sections is a plausible
contributing reason nobody trusts Home enough to look there first, but that's inference,
not something any tester said.

**A3 — guest stat as "N / M RSVP'd / invited"**
Claim: the stat doesn't make clear whether it's counting people or households, making it
hard to verify "2 households, 3 people" visually.
**Status:** unverified — no real session has tested exactly this reading.

**A4 — Budget module doesn't show which category $400 went to**
Claim: the Budget snapshot shows "$400 planned / $9,600 remaining" without saying it's
"Flowers."
**Status:** contradicted by what we've actually seen. In both 001 and 007, the Budget page
shows a line item reading "Flowers · $400 ($400 paid)" directly under the summary numbers
— category is visible, just one scroll down, not in the top summary tiles themselves. If
this claim is really about the top-of-page summary tiles specifically (not the page as a
whole), it's narrower than written here and worth rephrasing before treating as a finding.

**A5 — "Ask Piper" button overlaps primary actions, risk of misclicks**
Claim: the floating Piper launcher sits over other buttons/text, risking accidental taps
and needing clearer confirmation after an AI-driven change.
**Status:** partly contradicted on the confirmation point — 005's Piper interaction showed
a clear "Mark Sadie Moody as attending? → Done" confirm button, not a silent auto-apply.
The overlap/misclick claim itself is unverified (no recorded accidental click yet).

**A6 — Team/invite management is under "More," not the primary nav**
Claim: a user looking to invite a co-planner would expect that near the profile header,
not nested under a "More" dropdown.
**Status:** unverified directly, but doesn't fully match the real sessions: in 001, the
couple found the Team/invite flow and completed an invite (A6) without reporting this as
a blocker — the friction there was needing a real contact's email, not finding the nav
item. Worth a specific check next time rather than assuming it's a problem.

## Takeaway

Two of six points are plausible and worth testing for real (A1, A3); two are weakly
supported by what we've actually observed (A2, A5); two are contradicted or narrower than
stated by real evidence we already have (A4, A6). Treat this list as a set of things to
watch for in the next live session, not as settled findings.
