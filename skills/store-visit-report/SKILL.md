---
name: store-visit-report
description: Turns store visit notes into a report: planogram compliance, out-of-stocks, demo units, competitor activity, an owned action for every issue, and the internal notes in a file of their own. Use when given field notes or store or market visit notes, or asked for a store visit recap.
---

# Store visit report

Turn field notes from store visits into a report a manager and a client can
act on.

## For each visit

Every field below, for every visit; "not recorded" where the notes are
silent.

- Store, retailer, region, date, visited by.
- **Planogram compliance** (%), and what was off.
- **Out-of-stocks** by SKU, with backroom counts if noted.
- **Demo units** working vs total.
- **Competitor activity:** promotions, ambassadors, new products, pricing.
- **Actions:** what, owner, due date. Every issue gets one, a compliance
  score below 100% included. An action the
  notes mark done still names who did it: if they don't say, use the
  visitor and mark it "Proposed". Never write that an action has happened
  unless the notes say it has, in the report or in your reply. An action the
  notes mark done takes the visit date as its due date.

## Then roll up

1. **Patterns across stores:** the same out-of-stock in two or more stores of
   the same retailer, especially with an empty backroom, points to supply
   rather than one store. Say how strong the signal is. Say "out" only where
   the shelf count is zero and "low" otherwise; the headline must match the
   visit table.
2. **Top three actions** by impact, with owners.
3. **What to tell the client** and **what stays internal**, as two
   separate files, so nothing internal can ride along when the report is
   sent. Per-visit details, patterns and top actions go in the client report
   unless they hold internal material.

Save the client report as `<date>-store-visit-recap.docx` and the internal
notes as `<date>-store-visit-recap-internal.md` (today's date, YYYY-MM-DD),
both in the account's `outputs` folder (see Where things go). Say in your
reply what went in the internal file and why. Where a note leaves something
out (no compliance score, no reason given), write "not recorded" rather than
guessing. Mark any action you propose that the notes didn't assign as
"Proposed"; it still gets an owner and a due date, never "not set".

## The look (a strategy memo in Word)

A Word document (`.docx`), US Letter, portrait, margins about 0.75 inch;
Markdown only if the person asks. With the client's brand guide, its colors
replace the navy and the accent; the layout stays.

- **Font, in this order:** Avenir Next LT Pro (a Microsoft 365 cloud font),
  then Gotham where the person has it, then Avenir, then Segoe UI. **Never
  Calibri**, even as a fallback. Name Avenir Next LT Pro in the file (Office
  downloads it); use Gotham only when the person says they have it. Set it
  everywhere a default lives: the theme's heading and body fonts, the
  document defaults and the Normal style, not only the text you write, then
  check those in the saved file.
- **The top:** a thin dark navy rule; a small all-caps gray label
  ("STORE VISIT RECAP · DALTON AT BEST BYTE"); the pattern that matters most as a sentence headline (about 18pt,
  bold, navy); one gray line saying who it's for, the date and the scope.
- **The body:** small all-caps navy section labels; tables with a navy
  header row, thin gray rules and numbers right-aligned; one form per
  number throughout.
- **Footer:** "Confidential · page n", and the license footnote on any page
  that uses licensed data.
- **Before you save:** open what you made and check it: the length, no
  Calibri anywhere, every number cited. Say what you checked.
- **Visits and actions as tables:** one row per visit (store, date,
  compliance, out-of-stocks, demo units); actions with owner, due date and
  status ("Proposed" where the notes didn't assign it).

## Privacy rules

- **Leave out personal contact details** (a manager's personal cell, a
  shopper's email). Write "contact on file" in the client report where the
  detail would have gone.
- **Shoppers are never named** in a report that leaves the team.
- **Anything told in confidence** goes in the internal file, is marked as
  such, and never appears in the client report. So does any action
  that exists because of it.
- **Facts from outside the visit notes** (an email, the account's
  `memory.md`, someone's recollection) go in the internal file, marked
  unverified, until someone confirms them.

## Where things go

These lines fit the course workspace (`about-me/`, `projects/<account>/`,
`outputs/`). Skip any part that isn't there. The account is the client the
work is for. `projects/rita-agent/` is the course kit, never an account:
its practice data is for Dalton, its practice client. List `projects/`
first, and never say an account's folder is missing without having listed
it.

- **Read the account first.** When the work is for an account (named, or plain
  from the material, such as Dalton products in an export), list `projects/`
  to find its folder (the practice account is `projects/dalton/`), and read
  its `brief.md` and `memory.md` before you start, and use its `reference/`
  folder (brand guide, glossary, templates). Work for one engagement
  (`projects/<account>/<engagement>/`) reads that folder's `brief.md` and
  `memory.md` too.
- **Learn from the sources, not old outputs.** Take the client's style
  and rules from its `brief.md` and `reference/`, not by copying an earlier
  file in `outputs/`. If an old deliverable is the best example, suggest
  putting a copy in `reference/`.
- **Write as the person.** Emails and drafts written as them follow
  `about-me/writing-rules.md`; your reply to them doesn't.
- **Save** to `outputs/<account>/` (or `outputs/<account>/<engagement>/`) at
  the top of the workspace, or `outputs/store-visit-report/` when no account
  applies, unless the person names a place. Without a workspace folder, offer
  the file to download. Say where it is.
- **Working files stay out of the workspace.** Build scripts, test renders
  and scratch copies go in a temporary folder outside it, or are deleted when
  you finish; only what you deliver lands in `outputs/`.
- **Offer a memory line.** When you deliver, write out a one- or two-line
  entry for the account's (or engagement's) `memory.md` (what you made, where,
  what's still open) and offer to add it. Write it only on a yes, and keep
  client figures (any number from the data: units, returns, prices, sales),
  contact details and anything confidential out of it.
