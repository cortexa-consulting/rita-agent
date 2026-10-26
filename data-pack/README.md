# The data pack

Practice files for the exercises, built to feel like a real week at a field
sales and marketing agency. **Every company, person, number, email address
and phone number in this folder is invented.** The retailers and brands are
deliberate knockoffs so the work looks familiar without anyone mistaking it
for real data. Email domains end in `.example` and phone numbers use the
555-0100 to 555-0199 range, both reserved for fiction, so nothing here reaches
a real inbox or phone.

## The world

You are **Taylor Brooks**, an account manager at **Halcrest Retail Partners**,
an agency that places and supports **Dalton Computers** products in retail
stores. It is Monday, November 2, 2026. Thursday is Dalton's Q3 business
review.

| Retailers | Brands |
| --- | --- |
| Best Byte · Macro Center · ValuMart · Costwise Club · Bullseye | **Dalton Computers** (your client): Vantage 14 and 16, Aero 14, Forge 16 laptops; ClearView monitors · **Samsonic** and **HavenPoint** (competitors) |

## What is in here

| Folder | What it is |
| --- | --- |
| `inbox/` | 18 emails from Monday morning (`.eml` files): the client, retailers, your field team, your manager, IT, and a few you should not trust. |
| `sales/dalton-sell-through-q3-2026.csv` | Dalton's weekly sell-through for Q3 (13 weeks ending Oct 3): retailer × region × product, units, dollars, price, inventory, promotions. **It has problems. Find them before you trust it.** |
| `sales/category-share-by-brand-q3-2026.csv` | A retail panel: weekly laptop and monitor units for Dalton and its competitors, by retailer. Use it for market share. |
| `sales/promo-calendar-q4-2026.csv` | The retailers' holiday promotion calendar. |
| `crm/opportunities-export-2026-11-02.csv` | A CRM opportunity export: 42 retail programs in the pipeline, **with contact names, emails and phone numbers in it.** |
| `field-notes/` | Store visit notes from the field sales managers. Some contain things that should not leave the team. |
| `client/` | The client's brief for Thursday's deck, and Dalton's brand guide. |
| `redact-practice/` | A launch deck, a memo, a workbook and an email about **Project Kestrel**, an unreleased Dalton laptop under NDA, for practicing Redact & Restore on real file types (exercise 6). |

## The exercises

Put the whole `rita-agent` folder in `Claude Workspace/projects/`, connect
Claude Desktop to `Claude Workspace`, and start each task from there. The
prompts point Claude at the skills in `projects/rita-agent/skills/`, so they work
whether or not you've installed the plugin. These are the same prompts as the course slides.

### 1. Triage the inbox

```
Read projects/rita-agent/skills/inbox-triage/SKILL.md and follow it. Triage the
emails in projects/rita-agent/data-pack/inbox. I'm Taylor Brooks, account manager
for Dalton Computers at Halcrest Retail Partners. Give me the top three
things to do today, the four piles, and draft replies for every Urgent
and Needs-reply email, saved as files. Do not send anything.
```

Then check: did it catch the phishing email, and the one that tries to give
Claude instructions?

### 2. Check the data, build the grid, then the deck

```
Read projects/rita-agent/skills/sell-through-recap/SKILL.md. Using
projects/rita-agent/data-pack/sales/dalton-sell-through-q3-2026.csv, check the
data first and list every problem you find, with the rows involved,
before you build anything. Don't fix anything yet: tell me what you'd
fix and why, and wait for my OK.
```

```
Apply the fixes I approved, and follow
projects/rita-agent/skills/excel-grid/SKILL.md. Build
outputs/dalton/q3-sell-through.xlsx: retailer and product line down the
side, weekly units and net sales across, Q3 totals and week-over-week
change, a flag on anything that moved more than 20%, and a README tab
that lists the data problems found and how each was handled.
```

```
Read projects/rita-agent/skills/client-deck/SKILL.md and everything in
projects/rita-agent/data-pack/client/. Build the 6-to-8-slide Q3 business review
deck Rachel asked for from the workbook you just built. For market share, use
projects/rita-agent/data-pack/sales/category-share-by-brand-q3-2026.csv.
Put the answer on slide 2, make every headline a full sentence, cite the
source file on every number, and add speaker notes. Save it as
outputs/dalton/q3-qbr.pptx.
```

Then run the summary test, the way a client's AI summarizer would:

```
Summarize outputs/dalton/q3-qbr.pptx in three bullets for a busy VP
who will not open it. Then tell me what a reader might get wrong from
this deck, and which slide causes it.
```

### 3. A pipeline dashboard, redacted first

1. Open `rita-agent/tools/redact-restore/redact-restore.html` in your browser
   and open `rita-agent/data-pack/crm/opportunities-export-2026-11-02.csv` in
   it. Keep its suggestions (drop emails and phone numbers; mask contact
   names, owners and accounts), click **Redact**, read the result, then save
   the redacted file and the key file **outside** your Claude Workspace folder.
2. Start a **new chat** (not a task in your workspace, which can read the
   original), attach only the redacted file, and paste:

```
Read the attached CRM export. Keep every placeholder like
[CONTACT-NAME-3] exactly as written and never ask for the real values.
Build a one-page pipeline dashboard as a single web page: open and
probability-weighted pipeline, pipeline by stage and by account, deals
closing in the next 30 days, and open deals with no activity in more
than 21 days (oldest first, with owner and next step). The export date
is 2026-11-02. Reconcile the open pipeline total against the export and
show both numbers.
```

3. Paste the stale-deal list from Claude's answer into **Restore** to see the
   real names again, on your own computer.

### 4. Teach Claude your weekly recap

On a Mac (Pro, Max or Team): **+ → Record a skill**, then do a small recap by
hand (filter the sell-through file to one retailer, find the biggest mover,
write three lines about it), talking through what you do and why. Close
email, client files and the CRM first: everything on screen is captured. On
Windows, or anywhere: type `/skill-creator` in the chat from exercise 2 and
ask it to make a skill from what you just did.

### 5. Ask RITA about share

Make a RITA project from your whole `Claude Workspace` folder, with the
contents of `projects/rita-agent/CLAUDE.md` as its instructions, then:

```
rita: for Dalton. Rachel wants to know if the Samsonic BookAir 15
launch is taking share from Dalton laptops. Use
projects/rita-agent/data-pack/sales/category-share-by-brand-q3-2026.csv.
Compare Best Byte and Macro Center, where it launched on Sept 6, against
the other retailers.
```

### 6. Practice: redact a deck, a memo, a workbook and an email

In class, the deck is the hands-on; the memo, workbook and email are good
practice before you redact a real file. Open
`rita-agent/tools/redact-restore/redact-restore.html`, open your
`dalton-key.json` if you saved one (its lists and column choices come
back), and type these lists in "Names and words to hide":

| List | Type |
| --- | --- |
| Companies | `Dalton Computers`, `Best Byte`, `ValuMart`, `Halcrest Retail Partners` |
| People | `Rachel Kim`, `Tessa Monroe`, `Taylor Brooks` |
| Products and code names | `Project Kestrel \| Kestrel` (the bar adds the short name as an alias) |

Then open each file in `rita-agent/data-pack/redact-practice/` in turn and
click **Redact**:

1. `kestrel-launch-plan.pptx`: read the file card first. It lists the hidden
   slide, the speaker notes, the comment and the names saved in the file,
   all of which are redacted too.
2. `kestrel-memo.docx`: the tracked deletion is removed, and the header and
   footer are redacted.
3. `kestrel-sell-in.xlsx`: every sheet gets its own column choices, the
   hidden one too, and the sheet named after a retailer is renamed.
4. `kestrel-thread.eml`: an email, as text.

Each time, look at **Names that may still be in**. The lists above leave out
two people on purpose, and the client's short name, "Dalton", appears on its
own. Add each real name to the right list (it redacts again for you),
dismiss the rest, and read the redacted text before you save anything. To
practice the round trip, attach the redacted deck to a new chat, ask Claude
for a one-slide summary of it as a `.pptx`, and drop that file on
**Restore** with your key. Save the key again afterward: next time, these
lists come back on their own.

## For instructors

The planted problems and the numbers that prove them are in the instructor
script, not here, so Claude cannot read the answers out of this folder.
