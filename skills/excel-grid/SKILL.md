---
name: excel-grid
description: Builds Excel workbooks (.xlsx) other people can trust: real formulas, one table per sheet, validation where people type, and a README tab. Use when asked for a spreadsheet, tracker, grid or Excel report, or to turn data into a workbook.
---

# Excel grid

Build spreadsheets other people can use and trust after you hand them over.

## Rules

1. **Formulas, not pasted numbers.** Totals, changes and ratios are formulas
   pointing at the data, so a corrected input fixes the output.
2. **One table per sheet**, formatted as an Excel Table, with a header row,
   frozen panes, and filters on.
3. **Inputs look different from outputs.** Light-tinted cells for anything a
   person types; everything else a formula. Don't protect sheets unless the
   person asks: a locked file is hard for the team to fix.
4. **Validation where people type:** drop-down lists for status, stage or
   region; date and number limits where they make sense.
5. **Conditional formatting with a legend.** Red and green alone are not
   enough: add an arrow, a symbol, or a label so it reads in grayscale and for
   color-blind readers.
6. **A `README` tab** first in the workbook: what the file is for, where the
   data came from (file and date), what each column means, and what each
   color means.
7. **Number formats:** currency with thousands separators, percentages to one
   decimal, dates as YYYY-MM-DD.
8. **No hidden logic.** No hidden sheets, no hard-coded overrides inside
   formulas, no macros.

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
  the top of the workspace, or `outputs/excel-grid/` when no account applies,
  unless the person names a place. Without a workspace folder, offer the file
  to download. Say where it is.
- **Offer a memory line.** When you deliver, write out a one- or two-line
  entry for the account's (or engagement's) `memory.md` (what you made, where,
  what's still open) and offer to add it. Write it only on a yes, and keep
  client figures (any number from the data: units, returns, prices, sales),
  contact details and anything confidential out of it.

## Before you deliver

Check the data first: duplicate rows, prices far from the item's usual
range, negative or zero units, gaps. List every issue and what you did with
it, including the ones you kept as reported. Never delete source rows: add
an include (Y/N) column so every exclusion stays visible.

Then change one input and confirm the totals move. Say which cell you
tested. List any assumption you made, and any value you filled in that the
source doesn't give (an owner, a date), in the README and in your reply.
