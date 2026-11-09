# Usability test 001: 2026-11-08, track A couple

**Who:** a bride, not yet married, setting up a wedding for the first time (test data: a
guest count of 300 and a budget of $10,000). Partner's name was a placeholder (the
builder's), not a real second tester.
**How they plan today:** not asked this session (recording starts mid-way through the
warm-up).
**Who else is involved:** a friend helping, invited by email during A6.
**How:** screen + audio recording, laptop (Chrome), about 11:45. Run on the local dev
server (`localhost:3000`) the day the About-page routing fix shipped.
**Role in the test wedding:** couple (full access).

## What we asked them to do

The Track A script from `000-test-plan.md`, tasks A1–A6, followed by the positioning
questions on `/about`. The formal wrap-up questions ("if you could change one thing,"
"would you use this for a real wedding") were not asked on camera — the recording ends
right after the positioning section.

## What they did

| Task | Result | Time | What happened |
| ---- | ------ | ---- | -------------- |
| A1 | Done, with hesitation | 0:23–1:54 | Signed up fine, but stalled twice: once when Chrome's password manager popped up over the form ("oops"), and again on the wedding-creation form's separate "Your name" field below "Partner 1" and "Partner 2" (both full first-and-last-name fields). She asked "Should I put my first and last name?" "I don't know... just my first name?" — unsure whether "Your name" needed to match the full-name format of the two fields right above it. Ended up typing just her first name, matching what she'd entered as Partner 1. |
| A2 | Done, fast | 2:04–3:03 | Found the Tasks checklist (0 of 41 done) without trouble; the back-and-forth on screen was really about the hypothetical date in the prompt ("if it was closer, like May"), not about navigating the app. |
| A3 | Done, but stuck a while | 3:03–5:05 | Added one single guest fine. Adding the second and third people "as one family" stalled for nearly two minutes — "wait, how do I add a family?", "this is hard," "it's so kind of confusing though." The mechanism is the **Invitation** dropdown on the add-guest form (default: "Their own invitation"), which isn't an obvious answer to "how do I add a family" — nothing on the form says that's where household grouping happens until you've already added the first person and can select them. She found it herself after re-reading the form's own helper text a few times. |
| A4 | Done, fast | 5:18–6:03 | Flowers deposit, $400 estimated and actual, no confusion. |
| A5 | Done, fast | 6:05–6:22 | Asked Piper "Who hasn't RSVP'd yet?" — Piper named the two outstanding invitations and noted neither had an email or phone saved. She replied "Sadie is confirmed she is coming," and Piper came back with a clean "Mark Sadie Moody as attending?" confirm button, which she tapped. Worked exactly as designed. |
| A6 | Done, but long | 6:22–9:55 | The friction here wasn't the app — it was needing a real person's real email. She spent most of this stretch trying to remember a friend's email handle (a nickname, "Smalls"), called her, got voicemail, then guessed the email from the nickname and it worked. Once she had an email, the invite itself ("Invite ready for ___. Your email app should open...") worked immediately. |

**Piper:** Two interactions, both went well. "Who hasn't RSVP'd yet?" got a specific,
accurate answer grounded in the actual guest list (named the two outstanding households,
correctly noted missing contact info). The follow-up to mark one as attending produced a
real "Yes, do it"-style confirm button ("Mark Sadie Moody as attending? → Done") rather
than just a text answer — this is Piper working as intended.

Quotes:
- "Wait, how do I add a family?"
- "This is hard."
- "It's so kind of confusing though."
- (On the invite needing a real email) "My email isn't really set up on this." / "It's
  gonna come from your email." / "Oh, true."

## Positioning

- **What they said it is:** "This is a wedding planning app website that's for wedding
  planners, people planning on getting married, the wife and, or the mother and father
  of the groom and the bride." Notably framed around family roles specifically, not "the
  people helping you" — echoes the exact assumption gtm/positioning.md says to avoid, and
  she wasn't prompted toward that language.
- **Didn't fit them:** "No, it looks good" — nothing named as off.
- **Zola / The Knot:** not asked this session.
- **Own logins for helpers:** asked carefully (with both options read aloud) — "I don't
  know. Maybe just their own login." A soft, uncertain yes, not a strong signal either way.
- **Vendor ads and suggestions:** one word — "Bother."

## Where they got stuck

- **A3, severity 3 (blocked for ~2 minutes):** the "add as family" mental model doesn't
  map onto the form's actual mechanism (the "Invitation" dropdown, labeled around sharing
  an invitation, not around households or family). This is the one place in this session
  where she used the words "hard" and "confusing" unprompted.
- **A1, severity 1 (minor friction):** the wedding-creation form has "Partner 1" and
  "Partner 2" as full first-and-last-name fields, then a separate "Your name" field lower
  down. The format mismatch (full name above, unclear whether "Your name" wants the same)
  is what triggered "should I put my first and last name?" — the answer ("same as
  Partner 1," first name is enough) was already in the helper text, but the name fields
  above it set an expectation of full names that the field below didn't match.

## What to change

Ranked, most important first. Severity: 3 = blocked a task, 2 = slowed them down or
confused them, 1 = a wish.

| # | Change | Severity | Evidence (task, quote) |
| - | ------ | -------- | ----------------------- |
| 1 | Make "add as family / household" discoverable on the add-guest form itself, not just inferable from the Invitation dropdown's helper text | 3 | A3: ~2 minutes stuck, "how do I add a family?", "this is hard" |
| 2 | Say "the people helping you," not "family and friends," in the Team page's invite copy and the signup page's subtitle | 2 | Seen on `/team` ("Invite family and friends by email...") and `/signup` ("...with your family and friends") — same gtm/positioning.md conflict as Home; now three places, not one |
| 3 | Clarify the "Your name" field on the wedding-creation form, or drop it if it only ever duplicates Partner 1 | 1 | A1: "should I put my first and last name?" hesitation |

**Would they use it:** not asked (recording ends before the wrap-up questions).
**Biggest surprise (mine):** her own unprompted description of who it's for ("the wife
and, or the mother and father of the groom and the bride") mirrors the exact
family-centric framing the positioning doc explicitly tries to avoid — worth watching
whether that's just her own frame or something the app's copy is reinforcing (see #2
above, which is copy using that same language in three places).
