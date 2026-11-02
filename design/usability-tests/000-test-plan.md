# Sprint 4 user tests: plan and script

**Goal:** 5 people (a mix of couples and parents) use the live app
(https://togetherwedding.vercel.app) for real tasks, one session each. Write each session up
from `000-test-template.md`, then pick the top 5 changes to ship (see "Picking the top 5").

**What we're testing:**

1. Can a new couple get from sign-up to a working plan without help?
2. Can someone the couple invites (a parent here) join and do their part with their own login?
3. Is Piper useful on a real question, and is "tap to confirm" clear?
4. The positioning's open questions (`gtm/positioning.md`): do people feel the shared-password
   problem, do helpers want their own login, does "a planner, not a storefront" matter.

## Who

| Track | Who | How many | Starts from |
| ----- | --- | -------- | ----------- |
| A: couple | Someone engaged or recently married (one partner or both) | 3 | A fresh sign-up on their own phone |
| B: parent | A parent who is helping, or helped, with a wedding | 2 | An invite link from a test wedding I set up |

At least one couple should be planning right now; at least one parent should have done this
before.

## Before each session

- [ ] **Track B only:** make a test wedding under my own account (sign up with a new email,
      create a wedding, add a few guests, a budget and a cake tasting on the calendar). On Team,
      invite the tester with their email (Together opens my email app with the link; send
      it): role **helper** for one parent, **planner** for the other. Assign them 2 tasks.
      Don't hand out the seed logins (`couple@demo.wedding` and the rest): a shared login
      would hide the exact thing claim 1 is about.
- [ ] Phone charged, screen recording or a second person taking notes. Ask before recording.
- [ ] Open a copy of `000-test-template.md` and fill in "Who" before they arrive.

## Script (about 30 minutes)

Say this, more or less, word for word:

> "Thanks for doing this. I'm testing the app, not you; if something's confusing, that's
> the app's fault and exactly what I need to find. Please think out loud as you go. I won't
> help much, because I won't be there when real people use it. Is it OK if I record the
> screen?"

### 1. Warm-up (5 min)

- How are you planning (or how did you plan) the wedding? What do you use: a notebook, a
  spreadsheet, an app, email?
- Who else is involved, and how do you share updates with them?
- Has anyone shared a login to a wedding app or account? How did that go?

### 2. Tasks (15–20 min)

Read each task out loud; don't show the screen it's on. Note the time, every pause, every
wrong tap, and what they say. Stop a task after about 3 minutes of being stuck: write down
where, then show them and move on.

**Track A: couple**

| # | Task (say this) | Done when |
| - | --------------- | --------- |
| A1 | "Sign up and set up your wedding." | The home screen shows their countdown |
| A2 | "What should you be working on right now?" | They name a task from Home or the checklist |
| A3 | "Add three people you'd invite, as one family and one single guest." | 2 households show on Guests |
| A4 | "You just paid a $400 deposit for flowers. Put that in." | A budget line shows $400 paid |
| A5 | "Ask Piper who still needs to RSVP, then use Piper to mark one of them as coming." | They tap "Yes, do it" and the RSVP changes |
| A6 | "Invite someone who's helping you, so they can sign in themselves." | Their email app opens with the invite link ready (they can send it to my email instead of a real person) |

**Track B: parent**

| # | Task (say this) | Done when |
| - | --------------- | --------- |
| B1 | "The couple sent you this invite. Get yourself in." (open the invite email) | They're signed in to the test wedding |
| B2 | "What have they asked you to do?" | They find their 2 assigned tasks |
| B3 | "You finished one of them. Mark it done." | The task shows done |
| B4 | "How much is left in the budget?" | They find the number (Home or Budget) |
| B5 | "Ask Piper something you'd normally have to text the couple about." | Piper answers from the plan |
| B6 | "Find out when the cake tasting is." | They find it on the calendar |

### 3. Positioning (5 min)

Open https://togetherwedding.vercel.app/about on their phone. Let them read it without
talking.

- In your own words, what is this and who is it for?
- Anything on this page that doesn't fit you? (Listen for: assumes family, assumes a planner.)
- Have you used Zola or The Knot? Would anything here make you switch, or not?
- **Couples:** would you want the people helping you to have their own login, or would you
  rather keep it yourself?
- **Parents:** would you want your own login, or would you rather the couple handle it?
- Do vendor ads and suggestions in a planning app help or bother you?

### 4. Wrap-up (2 min)

- If you could change one thing, what would it be?
- Would you use this for a real wedding? Why or why not?
- Thank them. Write up the session the same day, while it's fresh.

## Picking the top 5

After all 5 sessions, list every "What to change" item from the write-ups in the table below.
Score each one: **people** = how many of the 5 hit it; **severity** 3 = blocked a task,
2 = slowed them down or confused them, 1 = a wish. Rank by people × severity, then pick the
top 5 that can ship by the sprint review. Each one gets a spec in `specs/` before the work
(AGENTS.md).

| Change | Sessions | People | Severity | Score | Ship? |
| ------ | -------- | ------ | -------- | ----- | ----- |
|        |          |        |          |       |       |
