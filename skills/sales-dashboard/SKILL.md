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
  the file as text, with no forms and no requests to outside addresses.

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
- **Write as the person.** Emails and drafts written as them follow
  `about-me/writing-rules.md`; your reply to them doesn't.
- **Save** to `outputs/<account>/` (or `outputs/<account>/<engagement>/`) at
  the top of the workspace, or `outputs/sales-dashboard/` when no account
  applies, unless the person names a place. Without a workspace folder, offer
  the file to download. Say where it is.
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
