# Spec 001: About page (positioning)

**Status:** Draft
**Date:** 2026-10-30

## Problem

Sprint 4 needs a published page that says what Together is for, who it's for, and why
someone would choose it over Zola or The Knot. Today the logged-out landing page has a
headline and three short feature cards, and nothing that explains the difference. The
positioning is in `gtm/positioning.md`.

## What we're making

A public page at `/about` on https://togetherwedding.vercel.app, in the landing page's
style, with:

1. **Mission:** one or two sentences.
2. **Who it's for:** couples, and whoever is helping them plan. Say "the people helping you,"
   not "family" (see the language note in `gtm/positioning.md`).
3. **What sets it apart:** the five points in `gtm/positioning.md`, without naming
   competitors.
4. **Features:** what's live today, grouped by section.
5. **A call to action:** "Create your wedding" (`/signup`).

Linked from the landing page header ("About") and from the about page back to the home page.

## Out of scope

- Changing the landing page's hero or feature cards.
- Naming or comparing to Zola or The Knot on the page.
- Pricing, testimonials, screenshots, or analytics.
- A signed-in version of the page.

## Definition of done

- [ ] `/about` renders signed out and signed in, on a phone (375 px) and a desktop, with no
      horizontal scroll and no console errors
- [ ] Every claim on the page matches what's live (checked against `gtm/positioning.md`'s
      feature list)
- [ ] No copy assumes family is involved: "family" appears, if at all, only as one example
      among several
- [ ] `./scripts/check.sh` passes
- [ ] Shipped: live at https://togetherwedding.vercel.app/about and linked from the landing
      page
- [ ] How we'll know it works: in the Sprint 4 user tests, ask each person to read it and say
      in their own words who it's for and how it differs
