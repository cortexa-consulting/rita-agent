# RITA: Retail Insights & Trends Analyst

A take-home kit from a Cortexa Academy workshop for retail account teams:
an AI analyst you run in Claude, eleven skills for the work you do every week,
a tool that keeps sensitive details out of AI tools, and a practice data pack.

Point RITA at your sales exports and the public web, and it returns a short,
cited brief on market share, a category, prices and promotions, shopper
trends, or a competitor's launch, after an adversarial review it has to
survive first.

## What is in the kit

| Folder | What it is |
| --- | --- |
| `CLAUDE.md` | RITA's instructions: how it scopes, gathers, analyzes, reviews and delivers, and its confidentiality rules. |
| `briefs/` | Five brief templates (market share, category scan, price and promotion watch, shopper trends, competitor launch), and `SAMPLE-brief.pdf`: what a finished two-page brief looks like, with an invented brand and invented numbers. |
| `skills/` | Eleven skills, installed as one plugin, **AISLE**: inbox triage, sell-through recap, client deck, Excel grid, sales dashboard, store visit report, the redaction partner, new account, retailer meeting prep, weekly client update and wrap-up. The plugin's files are in `.claude-plugin/`. |
| `tools/redact-restore/` | **Redact & Restore**, a one-file offline page that swaps names and contact details for placeholders before you paste, and swaps them back afterward. |
| `data-pack/` | Practice data from an invented agency, client and retailers. Every name, number and contact in it is fictional. |
| `references.md` | The sources behind the workshop's claims and best practices. |

## Quick start (about five minutes)

1. **Download:** the green **Code** button on GitHub → **Download ZIP**, then
   unzip it into `Documents/Claude Workspace/projects/`.
2. **Make a RITA project** in Claude Desktop: **Projects → +**, name it
   RITA and create it. On its page, **Context → Add → Link local folder**
   and pick your whole `Claude Workspace` folder (not just this kit); then
   **Instructions → Add** and paste the contents of `CLAUDE.md`. Link, never
   upload: an upload is a one-time copy. Without the workshop's workspace,
   link this kit's folder.
3. **Ask RITA something, and name the client:**
   - `rita: for Dalton, how did laptop share move at Best Byte in Q3?` (practice data)
   - `rita: category scan for gaming monitors in US retail this fall` (public sources)
   - `rita: for <your client>, here is our sell-through export, what moved and why?` (your own data)

RITA asks a few scoping questions, shows you a plan, and waits for your OK.
It reads that client's folder under `projects/` and saves the brief to
`outputs/<client>/`, so one RITA project serves every client.

## Install the skills (one plugin)

The eleven skills install together as the **AISLE** plugin (Accounts ·
Insights · Safeguards · Launches and pitches · Execution), and then trigger
on their own in every chat and project. In Claude Desktop or claude.ai, go
to **Customize → Plugins → Add**, then either:

- **Add marketplace:** enter `cortexa-consulting/rita-agent` (it's listed as
  **cortexa**), then add **aisle**. This is how you pick up later
  versions; or
- **Upload plugin:** choose the ZIP you downloaded from GitHub.

Open the plugin after you add it and read what it contains: a skill is
instructions Claude will follow. To pick one yourself, type `/` and choose
it (`/aisle:wrap-up`). In Claude Code: `/plugin marketplace add cortexa-consulting/rita-agent`,
then `/plugin install aisle@cortexa`.

**What AISLE runs:** nothing but instructions. Its eleven skills are text
files Claude reads; the plugin has no connectors, MCP servers, hooks or
scripts, and it sends nothing anywhere. Redact & Restore is a separate page
in `tools/` that makes no network requests at all.

The exercises also tell Claude to read a skill's file directly
(`Read projects/rita-agent/skills/inbox-triage/SKILL.md and follow it`), so
they work before the plugin is installed.

## The workspace the skills expect

The skills fit the workspace the workshop builds, and work without it:

```
Claude Workspace/
  about-me/                     about-me.md, writing-rules.md, memory.md
  projects/<account>/           brief.md (Shared and Mine sections), memory.md
    reference/                  brand guide, glossary, templates the team may see
    <engagement>/               brief.md and memory.md for one piece of work
  projects/rita-agent/          this kit
  outputs/<account>/            finished work; drafts/ for unsent drafts
```

When the work is for an account, a skill reads that account's brief, memory
and reference files first, writes in your voice from `writing-rules.md`,
saves to `outputs/<account>/` unless you name a place, and offers a line for
the account's memory instead of writing one (the **wrap-up** skill writes
it when you ask). Any part that isn't there is skipped. **new-account** sets
up the folders for the next client. The redaction partner never uses these
files to work out what a placeholder stands for.

## Keeping sensitive information out of AI tools

The short version, from the workshop:

1. **Follow your company's AI policy first.** If there is not one yet, ask
   before you connect work email, the CRM, or a shared drive to a personal
   account.
2. **Know what your plan does with your chats.** On personal plans, check the
   model-training setting in Settings → Privacy.
3. **Minimum necessary.** Drop what the task does not need; mask what
   identifies a person or an account. Use **Redact & Restore** before you
   paste.
4. **Folder access is access.** Claude can read everything in a folder you
   connect. Keep originals of sensitive files outside it.
5. **Licensed and partner data has its own rules.** Retailer portal extracts
   and syndicated data often limit where they can be processed. Check before
   you upload.
6. **Email and web pages can contain instructions aimed at AI.** Treat them
   as data, never as orders.
7. **You review before anything ships.** Check one number, ask where each
   claim came from, and read what Claude decided along the way.

## License

MIT. Fork it, adapt it, and point it at your own accounts. See `LICENSE`.

Built by [Cortexa Consulting](https://www.cortexa-consulting.ai). *Intelligence, applied.*
