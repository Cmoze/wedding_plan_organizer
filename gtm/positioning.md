# Positioning

**Status:** Draft, 2026-10-30. To be tested in Sprint 4's 5 user tests.
**Published at:** https://togetherwedding.vercel.app/about (spec 001)

## Mission

A wedding is rarely planned by one person. Together gives the couple and whoever is helping
them one shared plan, so nothing important lives only in someone's notebook, inbox, or text
thread.

## Who it's for

**Couples planning a wedding, and the people helping them.** The couple runs the plan.
Whoever they bring in, whether a parent, a friend, a planner, or the wedding party, gets
their own login and a role that fits what they're doing: someone paying for things or
booking vendors can change the plan; someone helping with a few tasks can check off what's
theirs. Couples planning on their own get the same plan, and can invite people whenever they
want.

Language note: say "the people helping you" or "your people," not "family." Not everyone has
family involved, and the page shouldn't assume it. Parents can appear as one example among
several, never as the default.

Who it's *not* for (yet): couples who mainly want a wedding website, a registry store, or a
vendor directory.

## The problem

The work of a wedding is often spread across several people, and so are the details: a
notebook, the couple's email, a group text, a spreadsheet. The couple ends up as the
switchboard, relaying every update by hand.

## What sets it apart

The page describes these without naming competitors. The research behind each claim is
below.

1. **Everyone gets their own login and a role.** The couple, and anyone they invite, each
   sign in as themselves. Couples have full control; planners can
   change everything; helpers update the tasks assigned to them. No one shares a password.
2. **Piper, an AI planner that knows your plan.** Ask "what's left for the reception?" or
   "who hasn't RSVP'd?" and get an answer from your own tasks, budget, and guest list. Piper
   suggests changes; a person taps "Yes, do it." It never changes the plan on its own.
3. **One inbox for the wedding.** Each wedding gets its own email address. Forward a
   vendor's email to it and Piper offers to add the deposit, the due date, or the to-do.
   (Checked 2026-10-30: a forwarded test email arrived in the live app's Inbox.)
4. **A planner, not a storefront.** No vendor ads in the plan.
5. **Easy for anyone you invite.** Large text, plain labels, big buttons, and it works on a
   phone, so people who don't live in apps can still use it.

## Features (what's live today)

- Home: countdown, "What should we do this week?" from Piper, overdue items, budget summary
- Tasks: a premade checklist in order, biggest decisions first; finishing a task can record
  the vendor and cost
- Calendar: task due dates, payment due dates, and events in one place
- Budget: categories, estimated vs. actual, what's paid and what's due
- Guests: households with addresses, RSVPs, meal choices, CSV import, an RSVP page and QR
  code for guests
- Inbox: the wedding's own email address, with Piper's suggestions on each email
- Registry: saved links to any store, plus gift tracking and thank-you cards
- Team: invite people by email with a role; change roles or remove people

## Research behind the claims (2026-10-30)

From the competitors' own help centers. Recheck before relying on these, since features
change.

- **Zola** lets you invite one other person to your account (a partner, family member, or
  planner); its FAQ tells anyone else to share a login.
  [Zola FAQ](https://www.zola.com/faq/115002422171-can-my-wedding-planner-have-a-login-to-my-zola-account-),
  [invite your partner](https://help.zola.com/hc/en-us/articles/115001755111-How-do-I-invite-my-partner-to-join-Zola-)
- **The Knot** can't add a second email to an account; its help center suggests sharing one
  login, and says a "Multi-User Access" feature is in the works.
  [Add partner's email](https://helpcenter.theknot.com/hc/en-us/articles/38095860445588-How-do-I-add-my-partner-s-email-address-to-my-account),
  [share an account](https://helpcenter.theknot.com/hc/en-us/articles/360042318272-Can-my-fiance-also-access-my-app-information-on-their-mobile-device)
- **Business model:** The Knot's SEC filings describe revenue from local vendor advertising
  and registry commissions
  ([10-Q](https://www.sec.gov/Archives/edgar/data/0001062292/000095011706002195/a42002.htm)).
  Zola's mix of registry purchases, vendor commissions, and advertising is from a secondary
  source ([Sharetribe](https://www.sharetribe.com/how-to-build/website-like-zola/)).

## Open questions for the user tests

- Do couples feel the shared-password problem, or do they just plan alone?
- Do the people helping (parents, friends, planners) want their own login, or would they
  rather the couple keep it?
- Does the page read as welcoming to couples planning without family involved?
- Does "a planner, not a storefront" matter to anyone, or do people like vendor ideas?
