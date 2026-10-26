---
name: sell-through-recap
description: Turns a retail sell-through export into a recap: checks the data first (duplicates, odd prices, returns, out-of-stocks, gaps), builds the retailer-by-week grid, flags what moved and drafts the recap. Use for weekly or quarterly sell-through, POS or retail sales data.
---

# Sell-through recap

Turn a retail sell-through export into a recap someone can act on. Check the
data before you trust it.

## 1. Check the data first, and say what you found

Before any analysis, look for and report:

- **Duplicate rows** (the same week, retailer, region and SKU twice).
- **Prices that do not fit** (an average selling price far from the others for
  the same SKU, e.g. a missing digit).
- **Negative units** (usually returns: say so and ask; don't call them
  errors until the team confirms).
- **Zero on-hand inventory** (an out-of-stock hides lost sales: estimate
  them against a comparable region or the SKU's in-stock weeks, include the
  restock week, state the method and label it an estimate).
- **Gaps** (a week, retailer or SKU missing).

List each issue with the rows involved. **Do not silently fix anything.**
Propose a fix and wait for a yes, or show the numbers both ways: one total
as exported and one with every proposed fix applied. Use one basis in the
grid and the draft, and say which.

## 2. Build the grid

- Rows: retailer, then product line. Columns: weeks, then period total.
- Units and net sales, with week-over-week and period-over-period change.
- Flag cells that moved more than 20% week over week, with a symbol or a
  label in the cell (▲, ▼), never color alone.
- Load the `excel-grid` skill and build the workbook by its rules: real
  formulas, Excel Tables, a `README` tab, and an include (Y/N) column for
  any row a proposed fix leaves out.

## 3. Say what moved, and why you think so

Three to five findings, biggest dollar impact first. For each: the number,
the comparison, the likely cause, and how sure you are. Mark a hunch as a
hunch.

## 4. Draft the recap

A short email or memo to the reader the account brief names: the headline
in one sentence, the findings, the data issues found, and one ask. Make no
promise in the person's name. Save it as its own file in a `drafts/` folder
beside the grid, separate from your reply, even for a one-week recap. Never
send it.

Cite the file and rows behind every number.

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
  the top of the workspace, or `outputs/sell-through-recap/` when no account
  applies, unless the person names a place. Without a workspace folder, offer
  the file to download. Say where it is.
- **Offer a memory line.** When you deliver, write out a one- or two-line
  entry for the account's (or engagement's) `memory.md` (what you made, where,
  what's still open) and offer to add it. Write it only on a yes, and keep
  client figures (any number from the data: units, returns, prices, sales),
  contact details and anything confidential out of it.
