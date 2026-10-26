---
name: new-account
description: Sets up the folders for a new client account, or for an engagement inside one, in the course workspace: a brief.md with Shared and Mine sections, a memory.md, a reference/ folder and an outputs folder. Never overwrites an account that exists. Use when asked to set up, add or start a new account, client, brand or engagement, or to make a project folder for one.
---

# New account

Give a new client, or a new piece of work for one, the same shape as every
other account, so Claude can pick it up from the files next time.

## Before you build

1. **Look first.** If `projects/<account>/` already exists, change nothing
   in it. Say what is there and offer to add only what's missing, or an
   engagement inside it.
2. **Get what you need, once.** From the request, find: the client and what
   the team does for them; the retailers or channels; who's who, by role;
   how they like to receive work; anything confidential about the
   account; and whether its files are mostly yellow (internal or client
   data that needs redacting before it comes in). Ask only for what's
   missing, in one short list, and wait. If the request covers it, build
   now.
3. **Keep the files clean.** No personal phone numbers or emails (roles and
   names are fine; contact details stay in the CRM), no pricing, no client
   figures, and nothing confidential: write "Confidential: [what kind], kept
   out of these files" instead. A product under NDA is "an NDA product, code
   name <X>" or nothing: no year, category or specs.
4. **Build from the request and the account's own files.** Don't copy in
   facts from emails, field notes or data files; the account's work will
   read those when it needs them. Never fill a field with a guess (who owns
   something, who's involved, what the person wants): anything neither the
   request nor the files say is "to confirm".

## What to build

The account folder name is short, lowercase, with hyphens (`keystone-audio`).

- `projects/<account>/brief.md`:

  ```
  # <Account>

  ## Shared (team knowledge)
  - What it is:
  - Retailers and channels:
  - Who's who (roles; contact details stay in the CRM):
  - How they like to receive work:
  - Reference files: reference/ (brand guide, glossary, templates)
  - Confidential: (what kind, kept out of these files; an NDA product is
    its code name only)
  - Files: (for a mostly-yellow account: they arrive as redacted copies
    only; the originals, the Redact & Restore key and restored files stay
    outside Claude Workspace)

  ## Mine (just me)
  - My role on this account:
  - What done looks like for me this quarter:
  ```

- `projects/<account>/memory.md`, with three headings: **Where it stands**,
  **Decided**, **Open**. Keep it under a page; finished items move to
  `memory-archive.md` beside it.
- `projects/<account>/reference/README.md`: one line saying what goes here
  (brand guide, glossary, templates: files the whole team may see). Copy in
  only files the person points to, never originals of licensed or partner
  data.
- `outputs/<account>/`, with a `drafts/` folder inside.

**An engagement** (a launch, a reset, a line review) gets
`projects/<account>/<engagement>/` with its own `brief.md` (Shared and Mine,
plus what done looks like and by when) and `memory.md`, and
`outputs/<account>/<engagement>/`. It uses the account's `reference/`, and
nothing in the account's own files changes.

## When you're done

List every folder and file you made. Then suggest a project for it: the
project's folder is the person's whole workspace, and its instructions are
"This project is <Account>. At the start of every session, read
projects/<account>/brief.md and memory.md. Save finished work to
outputs/<account>/." For an engagement, name the engagement and add its
own brief, memory and outputs folder to those instructions. Offer, and write only on a yes, a line in
`about-me/memory.md` listing the new account.
