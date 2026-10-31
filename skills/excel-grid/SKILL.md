---
name: excel-grid
description: Builds Excel workbooks (.xlsx) other people can trust: real formulas, one table per sheet, validation where people type, and a README tab. Use when asked for a spreadsheet, tracker, grid or Excel report, or to turn data into a workbook.
---

# Excel grid

Build spreadsheets other people can use and trust after you hand them over.

## Rules

1. **Formulas, not pasted numbers.** Totals, changes and ratios are formulas
   pointing at the data, so a corrected input fixes the output.
2. **One table per sheet**, with a header row and frozen panes. Data tabs
   are an Excel Table with filters on; grids people read (the ones a client
   sees) skip the filter arrows.
3. **Inputs look different from outputs.** Light-tinted cells for anything a
   person types; everything else a formula. Don't protect sheets unless the
   person asks: a locked file is hard for the team to fix.
4. **Validation where people type:** drop-down lists for status, stage or
   region; date and number limits where they make sense.
5. **Color plus a label, built for Excel.** The team works in Microsoft
   Office, so Excel is the target. Never color alone:
   - On change grids, shade each cell on a diverging color scale (soft red
     through white at zero to soft green), and keep the cell a signed number
     (+5.0%, -4.3%), so it reads without color and totals still work.
   - Mark the moves that matter (past the person's threshold, or 20%) with
     a rule that adds ▲ or ▼ and bold. Its number format needs both a
     positive and a negative section (`"▲ "+0.0%;"▼ "-0.0%`), or the sign
     goes missing.
   - Any fill in a rule is the fill's background color: that's the one
     Excel shows.
   - Other apps, such as Numbers, drop conditional formatting; the signed
     numbers still read there. Say so in the README.
   - Before you report done, reopen the saved file and confirm a flagged
     cell shows its arrow and shading, a small decline still shows its
     minus sign, and no cell or style uses Calibri: read the first `<font>`
     in `xl/styles.xml` (openpyxl's default, which blank cells get) and the
     theme's fonts, not only the cells you formatted.
6. **A `README` tab** first in the workbook: what the file is for, where the
   data came from (file and date), what each column means, and what each
   color means.
7. **Number formats:** currency with thousands separators, percentages to one
   decimal (signed on changes), dates as YYYY-MM-DD in data; readable dates
   ("Jul 18") in the headers of grids people read.
8. **No hidden logic.** No hidden sheets, no hard-coded overrides inside
   formulas, no macros.
9. **A finished look.** Every sheet a person reads should open like a
   finished client file:
   - **the font, in this order:** Avenir Next LT Pro (a Microsoft 365
     cloud font, so Office downloads it when the file opens), then Gotham
     where the person says it's installed and licensed, then Avenir, then
     Segoe UI. **Never Calibri**, even as a fallback or when a brand guide
     asks for it (use the first font on this list and say so). Set it as
     the workbook's default (Normal) style as well as on every cell,
     header, chart and note, so nothing falls back to Excel's Calibri. In
     openpyxl, replace the default font itself and the theme's major and
     minor fonts;
   - a title block: what it is and for whom ("Dalton Computers · Q3 2026
     Sell-Through"), and a subtitle saying what the numbers are and for
     which period;
   - headers in title case ("Retailer", "Product Line"), never raw column
     names, right-aligned over numbers;
   - a dark header band with bold white text, or the client's colors when
     its brand guide is in `reference/`;
   - gridlines hidden, columns sized to fit, light row rules, and a bold
     total row with a rule above it;
   - a legend and a source line under the table (the file, what was fixed,
     and "Fictional practice data" when it is);
   - landscape, one page wide when printed.

   That covers every tab, not just the grids:
   - **README:** the same title block, then short sections with bold
     headings, wrapped text in a wide second column, and no cell borders.
   - **Checks:** each check on its own row with the expected and actual
     values and a result that reads ✓ Pass or ✗ Fail (shaded green or red),
     with a one-line "all checks pass" summary at the top.
   - **Data:** the export as received, so keep its column names for
     tracing, but as an Excel Table with a banded style, a frozen header,
     sized columns and number formats.

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
  the top of the workspace, or `outputs/excel-grid/` when no account applies,
  unless the person names a place. Without a workspace folder, offer the file
  to download. Say where it is.
- **Working files stay out of the workspace.** Build scripts, test renders
  and scratch copies go in a temporary folder outside it, or are deleted when
  you finish; only what you deliver lands in `outputs/`.
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
