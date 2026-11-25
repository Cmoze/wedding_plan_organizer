# Spec 004: Send and reply from the wedding inbox

**Status:** Draft
**Date:** 2026-11-25

## Problem

The wedding inbox only receives. When a vendor's email comes in, the couple has to open their
own email, find the thread, and reply from there. Then the reply lives in one person's inbox
and the rest of the people helping never see it. That breaks Together's promise that
"nothing important lives only in someone's notebook, inbox, or text thread"
(`gtm/positioning.md`).

There's no user evidence for this yet. No tester asked to send from the inbox in Sprint 4's
five tests. It comes from the builder (2026-11-25). Before building past step 1, ask the next
couples who test whether they'd reply from Together or from their own email.

Today: each wedding gets `<slug>@<INBOUND_EMAIL_DOMAIN>`, on Resend's free receiving domain
(`xxxx.resend.app`). Resend calls `app/api/inbound-email/route.ts`, which saves the email to
`emails`. Nothing sends. Resend only sends from a domain you own and have verified, so sending
needs our own domain.

## What we're making

### 1. Our own mail domain, set up so mail doesn't go to spam

This step comes first. If it isn't right, the rest doesn't matter.

- **Buy a domain** (about $10–12 a year for a `.com`; name to be decided, see Open questions).
- **Send and receive on a subdomain**, e.g. `mail.<domain>`, so wedding addresses are
  `maya-jordan@mail.<domain>`. If the mail ever gets a bad reputation, the main domain (the
  website, and any real mailbox later) isn't affected, and its MX records stay free.
- **Verify the subdomain in Resend** and add the DNS records it gives:
  - **SPF**: says Resend is allowed to send for this domain.
  - **DKIM**: signs every email so receivers can tell it wasn't changed and really came from us.
  - **Custom return path** (Resend's `send.` records): makes SPF line up with our domain.
  - **DMARC**: `_dmarc.mail.<domain>` TXT, starting at `v=DMARC1; p=none; rua=mailto:<reports address>`.
    Move to `p=quarantine` after two clean weeks of reports.
  - **MX** for receiving, pointed at Resend's inbound servers.
  Gmail, Yahoo and Outlook now expect SPF, DKIM and DMARC that line up with the From
  domain. Missing any of them is the most common reason new senders land in spam.
- **Turn off open and click tracking** in Resend for this domain. Tracking rewrites links and
  adds a hidden image, and both look like marketing mail to spam filters. These are
  one-to-one emails, not campaigns.
- **Keep the old addresses working.** Leave the `resend.app` receiving domain on for at least
  three months, so vendors who already have the old address still reach the wedding. The app
  shows only the new address.

### 2. Reply from the inbox

- On an email's page, a **Reply** button (couple and planners only; see "Who can send") opens a
  box under the email: To (filled with the sender, editable), Subject ("Re: …"), and the
  message. Send and Cancel.
- The email goes out **from the wedding's address**, with the couple's names as the From name:
  `"Maya & Jordan" <maya-jordan@mail.<domain>>`. Replies come back to the same inbox.
- **Threading:** set `In-Reply-To` and `References` from the original's `Message-ID`, so the
  vendor's mail app shows the reply in the same conversation. This needs the received email's
  `message_id`, which the webhook has but we don't save yet.
- Each email goes out as **plain text plus simple HTML**, with no images or templates. Plain
  personal mail is less likely to be flagged than heavy HTML.
- After sending: the box closes and "Sent to Bloom Florals." appears. The reply shows in the
  thread under the email, marked "Sent by Jordan".

### 3. Write a new email

- "New email" on the Inbox: To, Subject, message. Same rules as Reply.
- One recipient per email in this version (see Out of scope).

### 4. Sent mail in the Inbox

- Inbox shows two tabs: **Received** (today's list) and **Sent**.
- An email page shows the whole conversation: received and sent messages in time order.

### 5. Who can send, and limits

- **Couple and planners can send.** Helpers can read the inbox but not send. Everything a
  wedding sends goes out under the couple's names, so it should come from people with full or
  editing rights. This matches the current `emails` rules ("editors can update").
- **Piper doesn't send.** Piper can offer to draft a reply ("Want me to draft a reply?"). The
  draft fills the Reply box and a person reads it and taps Send. This keeps the rule that Piper
  never acts on its own.
- **Daily cap per wedding: 30 emails.** If a wedding is set up to send spam, it hurts every
  wedding's mail, so the cap protects everyone. Hitting the cap shows "You've sent 30 emails
  today. You can send more tomorrow." The cap is checked on the server, not just in the page.
- **Bounces and spam reports:** handle Resend's `email.bounced` and `email.complained`
  webhooks. A bounced address shows "This address didn't accept your email" on the sent
  message. Later emails to that address are blocked with that message. A spam report pauses
  sending for that wedding until the builder looks at it.

### Data (needs the builder's OK before writing the migration)

Proposed changes to `emails`:

- `direction` text, `'received'` or `'sent'`, default `'received'`.
- `message_id` text: the email's `Message-ID` (saved for received mail too, for threading).
- `in_reply_to_email_id` uuid, references `emails (id)`, null for new conversations.
- `sent_by` uuid, references the member who sent it, null for received mail.
- `delivery_status` text, null for received mail: `'sent'`, `'delivered'`, `'bounced'` or
  `'complained'`.

A new table `email_suppressions` (`wedding_id`, `address`, `reason`, `created_at`) for bounced
addresses. Sending runs on the server with the member's own client, so the existing rules
apply. Members can read; only editors can insert sent rows.

## Out of scope

- Attachments on sent mail. Received attachments keep working.
- More than one recipient, CC, and BCC.
- Sending to guests in bulk (save-the-dates, RSVP reminders). That's marketing-style mail with
  unsubscribe rules and a much higher spam risk. If it's wanted, it gets its own spec and
  probably its own subdomain.
- Drafts that are saved between visits.
- A real personal mailbox on the main domain (Google Workspace, Zoho). That's separate, and
  the subdomain plan leaves room for it.
- Rich text formatting in the message box.

## Definition of done

- [ ] The domain is bought and verified in Resend. SPF, DKIM, DMARC and MX all show as verified.
- [ ] **Not spam, checked:** a reply from the live site to a fresh Gmail, Outlook.com and
      iCloud address each lands in the **inbox** (Gmail: the Primary tab). Gmail's
      "Show original" shows SPF, DKIM and DMARC all **PASS**.
- [ ] A reply sent from the live site scores 9/10 or better on mail-tester.com.
- [ ] A vendor-style test: email the wedding from Gmail, reply from Together, reply again from
      Gmail. All three show as one conversation in Gmail and in Together.
- [ ] An email to the old `resend.app` address still arrives.
- [ ] A helper sees no Reply or New email button, and the server refuses a send from a helper
      (`npm run test:db`).
- [ ] The 31st email in a day is refused with the message above (`npm run test:db`).
- [ ] Sending to a known-bad address shows "This address didn't accept your email".
- [ ] Shipped on https://togetherwedding.vercel.app, and checked at 375 px.
- [ ] How we'll know it's used: count sent emails per wedding per week. Ask each pilot couple
      whether they replied to a vendor from Together or from their own email, and why.

## Build order

1. Domain and DNS (section 1), checked with a test send from Resend's dashboard. This can ship
   before any code, along with switching `INBOUND_EMAIL_DOMAIN` to the new subdomain.
2. Migration and the send route (server only), with the role check, cap and suppression.
3. Reply box and threading.
4. Sent tab, New email, bounce and spam-report webhooks.
5. Piper's "draft a reply" (Piper eval run after).

## Open questions

- **Which domain?** Something like `togetherwedding.com`. Check availability and price before
  buying. The builder buys it; agents don't buy things.
- **Where DMARC reports go:** a free report service, or an address on the main domain.
- **Resend plan:** the free tier is 3,000 emails a month and 100 a day across all weddings.
  Check whether received mail counts toward that. The 100-a-day limit is reached first if more
  than three weddings hit their cap. Fine for a pilot; Pro is about $20 a month.
