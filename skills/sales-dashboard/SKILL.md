---
name: sales-dashboard
description: Builds a sales or pipeline dashboard from a CRM opportunity export: open and weighted pipeline, win rate, stale deals, deals closing soon and pipeline by owner, using only the columns it needs and reconciled to the export. Use when asked for a pipeline or sales dashboard, or KPIs from a CRM or Salesforce export.
---

# Sales dashboard

Turn a CRM export (an opportunity or pipeline report) into a dashboard a
leader can read in one minute.

## Minimum necessary, first

Before building, list the columns you will use and the ones you will ignore,
and wait for the person's OK. If they have already named the columns to
leave out, that is the OK: build, and list what you kept. A pipeline dashboard does not need contact
emails, phone numbers, contact names or titles, or free-text notes (notes are
where confidential remarks hide). If the export contains them, say so, leave
them off the dashboard, and suggest removing all of them, Notes included,
before the file is shared again. If values are placeholders like `[CONTACT-NAME-3]`, keep them exactly
as they are, and never invent new ones (see the `redaction-partner` skill).

## What the dashboard shows

1. **KPI row:** open pipeline, probability-weighted pipeline, deals closing
   in the next 30 days, win rate on closed deals.
2. **Pipeline by stage** (a funnel or sorted bars) and **by account**.
3. **Stale deals:** open deals with no activity in more than 21 days, oldest
   first, with owner and next step.
4. **Closing soon:** the next 30 days, with amount and probability.
5. **By owner:** open and weighted pipeline per person.

## The look

A one-page brief a leader would forward, in the same family as the
client-deck and excel-grid looks:

- **Header:** a thin dark band down the left edge, a small all-caps label
  in the accent color ("DALTON ACCOUNT · PIPELINE REVIEW"), the page's
  takeaway as one sentence headline ("$1.08M is open across 25 deals; eight
  have gone quiet"), and the export date and row count in gray.
- **KPI row:** four big numbers between a dark rule above and a light rule
  below, each with a small all-caps label and one plain line ("25 open
  deals", "8 won of 17 closed").
- **Every section has a sentence headline** that says what it shows ("Eight
  open deals have had no activity for more than 21 days"), a gray caption
  naming the measure, and a thin rule.
- **Charts:** inline SVG bars, sorted, the one that makes the point in dark
  navy and the rest light gray, values labeled at the bar end. No axes or
  gridlines.
- **Stale deals:** each row's quiet time in a rounded chip with the day count
  written in it: red past 45 days, amber from 22 to 45. Color never stands
  alone.
- **Tables:** small all-caps headers, amounts right-aligned with tabular
  figures, deal IDs bold, and room for placeholders: never truncate
  `[OPPORTUNITY-OWNER-2]` or break it across lines (keep each placeholder
  on one line), so it reads and restores whole.
- **Footer:** the reconciliation line first, bold, ending in ✓ when the
  totals match; then the definitions in small gray type (export date, the
  30-day and 21-day windows, win rate by count, placeholders, fictional data
  when it is).
- **Color and type:** white page, dark navy, one blue accent, grays; the
  client's brand colors replace the navy and accent when its guide is in
  `reference/`. Font stack: "Avenir Next LT Pro", "Avenir Next", Avenir,
  Gotham, "Segoe UI", sans-serif. Never Calibri.
- **Prints and screenshots cleanly:** it reads on one wide screen, and a
  print style keeps it white, landscape and unbroken.

## Rules

- State the export date on the dashboard. A dashboard without a date is a
  rumor. Count every window from the export date: "next 30 days" includes
  the export date through 30 days later, and "stale" means more than 21 days
  since last activity. Say so on the page.
- Win rate is closed won ÷ all closed deals, by count; show the by-value rate
  beside it if it differs.
- Weighted pipeline = amount × probability. Show the formula once.
- Closed Won and Closed Lost are excluded from open pipeline.
- Every deal listed (stale, closing soon) shows its opportunity ID: deal
  names repeat.
- Label every chart directly; do not rely on color alone.
- Build it as a single HTML file (or an Excel workbook if asked), and say
  where it is saved. The page must not send data anywhere: the data sits in
  the file as text, with no forms and no requests to outside addresses. That
  means no web fonts, chart libraries or scripts from the internet: CSS and
  SVG inline only.
- Before you report done, open the page and look at it: the numbers match
  the reconciliation, every placeholder is intact and readable, nothing
  overlaps, and it loads nothing from outside.

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
  the top of the workspace, or `outputs/sales-dashboard/` when no account
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

## Before you deliver

Reconcile: total open pipeline on the dashboard equals the sum of open deals
in the export. Compute the export side separately, straight from the file
(for example, the full Amount column less closed deals), so the check is not
the same calculation twice. Show both numbers on the dashboard itself.
