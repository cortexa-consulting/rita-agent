# Redact & Restore

Swap the sensitive details in a document for placeholders **before** you paste
it into an AI tool, then swap them back into the answer, on your own computer.

```
Your file  →  Redact & Restore  →  placeholders  →  Claude  →  answer  →  Redact & Restore  →  real names back
              (on your laptop)                                                (on your laptop)
```

## Why a tool and not a skill

A skill runs inside Claude, so by the time it runs, Claude has already read
the file. Redaction has to happen **before** anything is pasted or uploaded,
which means outside the AI. That is this tool's whole job. The
`redaction-partner` skill in this kit is its other half: it keeps Claude
working with the placeholders instead of asking for the real values.

## How to use it

1. **Open `redact-restore.html`** in your browser (double-click it). Nothing
   to install. It opens dark, like the Cortexa site; the round button at the
   top right switches to light, and the page remembers your choice. At the
   top is the **client bar**: the key that's open, **Open a client key**, and
   **Start over**. Below it are two tabs, **Redact** (before Claude sees it)
   and **Restore** (after Claude answers), each with numbered steps. For a
   client you've done before, open their key first.
2. **On the Redact tab, drag a file into the upload box, click Choose a
   file, or paste text:** a PowerPoint deck, Word document or Excel workbook (`.pptx`, `.docx`,
   `.xlsx`), an email, notes or a CSV export (`.txt`, `.csv`, `.md`,
   `.eml`), or a PDF's text once you tick **Read PDF files**. Once a file opens, the box turns jade and names it; another file simply
   replaces it.
3. **List what to hide**, one per line, in the list it belongs to (Projects,
   Tools and "Anything else" sit under **More lists**): **Companies** (`[COMPANY-01]`), **People**
   (`[PERSON-01]`), **Products & code names** (`[PRODUCT-01]`: anything under
   an NDA, such as an unreleased product), **Projects and topics**
   (`[PROJECT-01]`) and **Tools and systems** (`[TOOL-01]`). Each list numbers
   its own placeholders from 01 up, so the AI can tell a product from a
   company. **Anything else** takes whatever doesn't fit (`[TERM-1]`). Any line
   can carry its own label instead: `Best Byte => RETAILER-A`.

   List people by full name. "Rachel Kim" also hides "Rachel" and "Kim" on
   their own, as the same `[PERSON-01]`, so "Rachel said" and "Ms. Kim" are
   caught, and restoring puts back the full name. Parts are matched only when
   capitalized ("kim chi" stays), even if you typed the name in lower case
   (it then restores as you typed it), and a first name two listed people share gets a placeholder of its own
   that restores as just the first name. Everyday words that are also names
   ("Will", "May", "Grant", "Price") are hidden only inside the full name, so
   "Will call Monday" keeps its word; the list is `COMMON_WORDS` in the page,
   and you can add to it.

   **Other names for the same thing go after a bar:** `Rachel Kim | Rach | RK`
   or `Best Byte | BB`. Each one is hidden as the first name's placeholder and
   restores as that name. An alias with a capital in it is matched exactly as
   typed (so `RK` leaves "rk" alone, and `Will Smith | Will` hides "Will" but
   not the word "will"); an all-lowercase alias matches any case. Use one for
   a nickname, initials, or a name part the tool otherwise leaves alone.
4. **For a spreadsheet, choose each column's fate.** *Drop* the columns the
   task does not need (the safest data is data you never paste). *Mask* the
   ones that identify a person or an account: each value becomes a
   placeholder like `[CONTACT-NAME-3]`, and those names are hidden wherever
   else they appear in the file too, first and last names on their own
   included, as in the People list. *Keep* everything the analysis needs.
5. **Click Redact, then read the result.** Open "What was replaced" (folded
   under the redacted text). Anything still identifying? Add it to your list
   and redact again.
   **"Names that may still be in"** lists capitalized words the tool saw
   and didn't hide: "Ms. Patel", "Hi Dana", "Marcus Webb", a word like
   "Jordan" mid-sentence. It only suggests. Pick a list and click **Add**
   to hide one (it redacts again for you), or **Dismiss** the ones that
   aren't names. A name that is a word of one already listed ("Dalton" when
   "Dalton Computers" is on Companies) starts on that list. It leaves out headings, job titles, the header row of a
   spreadsheet, and a word that also appears in lower case ("Rose" when
   "sales rose" is there too), so read the text yourself as well.
   The saved copy's file name is redacted with the same lists, in any case
   (`kestrel-launch-plan.pptx` saves as `[PRODUCT-01]-launch-plan-redacted.pptx`),
   and a restored file gets its real name back.
6. **Save the key file.** It is the only thing that can undo the
   placeholders. Keep it on your computer, outside Claude Workspace. Never
   paste it, upload it, or attach it to an AI chat. Rename it for the client
   (`dalton-key.json`): it is also that client's profile (below). After
   that, a key you opened is saved under its own name, so saving it again
   replaces it (if the folder you save to already holds one, your browser may
   add a number: keep the newest and rename it back).
7. **Paste the redacted text into Claude, or upload the redacted file,** and
   do the work.
8. **Restore.** Copy Claude's answer and click **Paste and restore**: the
   page reads what you copied, restores it, and copies the result, ready to
   paste. Or, on the Restore tab, paste it in yourself or drag in a file
   Claude made (if you closed the page, open the key in the client bar
   first), and click Restore. Placeholders go back to the
   real names, locally. A placeholder anywhere an app could turn into a
   request is deliberately left alone and reported: inside a web address
   (with or without `https://`, `//` or `www.`), a file path, a markdown
   link or image, an HTML tag, a query string (`?u=[PERSON-01]`) or a domain
   (`[COMPANY-01].example.com`). Your real values never belong in one, and an
   answer that puts them there may have been tampered with.

## One key per client: the profile

A saved key also remembers how you redacted: the lists (with aliases and
labels), the automatic finds you turned on, and each spreadsheet column's
Keep, Mask or Drop, by its header. Open the key next week and all of it comes
back, so the routine for a client you've done before is: open the client's
key, drop the file, click Redact, save. The same names get the same
placeholders every time, so `[COMPANY-01]` means the same client in every
file and every chat.

- **It only ever adds protection.** A profile adds names to your lists (it
  never wipes what you typed), can turn an automatic find on but never off,
  and can make a column stricter than the tool suggests but never looser. A
  key from someone else can't quietly hide less.
- **Every name it holds stays hidden.** A name the key already has is
  hidden in each new file with the placeholder it already has, whichever
  file it came from: a contact masked in last week's CRM export is still
  hidden when it turns up in this week's deck. Names you type on a list keep
  your list's placeholder.
- **It holds nothing new.** Every listed name is already in the key's
  entries; the profile adds your settings and column headers.
- **A damaged profile refuses the whole key** rather than half-loading it.
- **Save the key again after each redaction** so it learns new names. Keep
  one per client, outside Claude Workspace.
- **Switching clients:** click **Start over** (or reload the page), then open
  the next client's key. Start over forgets the key, its lists and column
  choices, so one client's names never end up in another client's key. If
  the key holds names you haven't saved, it asks once first.

## Where real names live

- **Outside Claude Workspace:** the original file, the key, and the restored
  version.
- **Inside it:** green material, and redacted copies. A redacted copy can go
  in the client's folder under `projects/` and be worked on with the kit's
  skills; the original never comes in.

Two habits save the most time. **Fix it at the source:** save a report view
in your CRM without contact columns, and its exports need little or no
redaction. **Restore once, at the end:** work with placeholders until the
deliverable is final, then restore that one file. Analysis that never leaves
the chat needs no restore at all.

## Word, PowerPoint and Excel files

Drop a `.pptx`, `.docx` or `.xlsx` file and the tool shows what's inside
before you redact: slides (hidden ones too), speaker notes, comments,
charts, pictures, sheets, and the names saved in the file's properties.
**Redact** gives you two things: the redacted text to read and paste, and a
**redacted copy of the file**, same layout, to save and upload.

What the copy covers:

- **Every piece of text a person can read:** slides, tables, speaker notes,
  comments, hidden slides, slide masters, headers and footers, chart labels
  and the data behind charts, picture names and alt text, link tooltips,
  every sheet of a workbook (hidden ones too), cell comments, data-validation
  lists and page headers.
- **Names split by formatting.** PowerPoint and Word often store one name as
  several pieces when the formatting changes mid-word ("Best " in bold,
  "Byte" in italics). The tool matches each paragraph as a whole and puts one
  placeholder where the name was.
- **Every sheet, with its own column choices.** Each sheet gets Keep, Mask
  or Drop for every column, like a CSV. A sheet named after a client is
  renamed (`COMPANY-01 Weekly`; sheet names can't hold brackets), and every
  formula that points at it follows. Excel names such as `FalconUnits` become
  `PRODUCT_01Units` the same way. Dropped cells are emptied under their
  header, and Excel recalculates when the file opens.
- **Deleted text Word still keeps.** A tracked deletion stays inside a
  `.docx` until it's accepted; the copy removes it.
- **Pictures, by default.** The tool can't read names or logos inside a
  picture, so every picture (and the file's preview thumbnail) becomes a
  plain gray box, keeping its size and place. Untick the option to keep them.
- **The names saved inside the file, by default:** author, last editor,
  company, manager and comment authors.

**Nothing is offered until it's clean.** Before the copy can be saved, the
tool searches every text part of the new file for every original value. One
hit and there's no Save button: instead it tells you what it found and where
("“Taylor Brooks” in slide 1"), so you can add it to a list and redact again.
Files it can't vouch for are refused outright, with what to do: videos and
sound clips, macros, embedded objects it can't read (including a Word file
that pulls in another document whole), text stored in an encoding the check
can't read, older `.ppt`/`.doc`/`.xls` files, and password-protected files.

**Restore into a file.** Upload the redacted deck to Claude, let it edit or
build a new deck, then drop the `.pptx` Claude made (or a `.docx` or
`.xlsx`) on the Restore tab with your key open. The real names go back in, layout intact,
and **Save restored deck** gives you the file. As with text, a placeholder
inside a link is left alone and counted.

**Restore a web page.** A dashboard Claude builds is an `.html` file full of
placeholders. Drop it on the Restore tab, click **Restore**, then **Save restored web
page**: you get `…-restored.html` with every real name back. Each name goes
in as escaped text (`Smith & Co` becomes `Smith &amp; Co` in the file), so a
name can't break the page or run as code; placeholders inside a tag or a
link stay put, so no link or refresh address can carry a name. The restored
page is also locked: the tool stamps in a security policy that runs no
scripts at all (a script could navigate away with the names, which a policy
can't otherwise stop) and loads or sends nothing (no network, forms or
outside content). The policy goes first in the file, ahead of anything the
page wrote, and the page's own refresh and prefetch tags are switched off,
since those reach out without any code. Its inline styles and SVG still
draw it, which is all a dashboard built to the sales-dashboard skill uses; if
a page relied on code, the tool says so, and the fix is to ask Claude to
rebuild it without scripts. Open it on your laptop, and keep it out of Claude Workspace.

Restoring is careful about where a real name could travel:

- A link's address (a web or email link) is redacted with the rest, and
  never restored, so links come back as placeholders. The same goes for Word
  field codes and the document's link base (HyperlinkBase), which every
  relative link starts from.
- A Word file with a field that makes Word fetch something (INCLUDETEXT,
  INCLUDEPICTURE, LINK, IMPORT, DDE) gets no real values back at all: a field
  nested inside it could read a name restored somewhere else.
- A file with macros, controls or parts the tool can't read gets no real
  values back either (sound and video are fine: they're only played), and
  neither does a file inside a file inside a file (two levels is as deep as
  it goes).
- A workbook gets real values back only when every formula in it just
  calculates (SUM, XLOOKUP, IF, TEXT and about 200 more), wherever the
  formula sits: a cell, a name, a data-validation list, conditional
  formatting, a chart, a pivot field. One formula that could send a value
  somewhere when Excel recalculates (WEBSERVICE, IMAGE, RTD, an add-in's
  function, a link to another workbook) and the message names it; data
  connections and Power Query are refused the same way. A HYPERLINK is fine
  with plain text in it, and nothing inside one is restored.

One more thing to know:

- One number written two ways (`(214) 555-0188` and `214-555-0188`) shares a
  placeholder and comes back in the form first seen. A number written with a
  country code other than +1 never shares one with a US number that happens
  to have the same digits.

## PDFs (optional, off until you tick it)

Tick **Read PDF files** under the Redact tab's upload box and a PDF's text lands in
the box, page by page, ready to redact like any other text. Two things to
know first:

- **You get text back, not a PDF.** The tool reads a PDF; it never changes
  one or makes a redacted copy. Redacting inside a PDF is a much harder job,
  and a "redacted" PDF that still holds the original text under a black box
  is a well-known way to leak.
- **Read the text before you redact it.** A PDF stores where each letter is
  drawn, not sentences, so the tool rebuilds lines and spaces from positions.
  It's usually right, but a narrow table cell can print one email address
  over two lines, and Word's tracked changes can print a deleted word flush
  against the next one. A listed name glued on like that is still caught; an
  address broken over two lines loses its name but keeps the rest.

It refuses password-protected PDFs, and says when a PDF is a scan: pictures
of pages, with no text inside to read. It doesn't read text in pictures
(there's no OCR).

The code that does all this is one section of `redact-restore.html`, called
**PdfReader**, with a plain-English explanation at the top. The browser never
shows it: open the file in a text editor (TextEdit or Notepad) and search for
PdfReader. It's written to be read: it's the whole of what the option does.

## What it finds on its own

On by default:

- **Email addresses**, including ones on non-English domains.
- **Phone numbers**: US ones with or without separators or a +1
  (`(214) 555-0125`, `214.555.0125`, `2145550125`, `+12145550125`), and
  others written with their country code (`+44 20 7946 0958`,
  `+33 (0)1 42 68 53 00`). A number never runs on past the end of its line,
  so the postcode underneath it stays as it is.
- **Social Security numbers**, with dashes, spaces or neither.
- **Payment card numbers**, checked with the Luhn checksum so an order number
  isn't mistaken for a card, and found even when an expiry date, a security
  code or another number sits right beside them, or two cards share a line.

Off by default: **money amounts** and **web links**. Turn them on when the
amounts or the links are themselves the sensitive part.

- **Money** means a number with a currency before or after it: `$14,250.00`,
  `US$900`, `€5,000`, `€1.250.000`, `£1.2M`, `USD 900`, `900 USD`,
  `12K Dollars`, `2.5 million euros`. A number with no currency (`12k units`, `18.4%`,
  `5 pounds`) is left alone.
- **Web links** means addresses starting `http://`, `https://` or `www.`, in
  capitals or not.

**A listed name run together is caught too.** "Best Byte" on a list also
hides `BestByte`, `Best-Byte`, `Best_Byte` and `Best.Byte`, so a hashtag, a
file name or a web address like `bestbyte.com` (which becomes
`[COMPANY-01].com`) gives nothing away. So is a plural (`Best Bytes` becomes
`[COMPANY-01]s` and comes back as "Best Bytes"; a short listed word can also
catch a longer one this way, "Nod" in "Nodes", which costs a placeholder but
restores exactly) and a word glued on with a capital (`BestByteWeekly`, or
`WebbProject` where a PDF lost a space). A first or last name on its own is
held to the word's edge, so "MacBook" is not Mac Smith.

**Typing differences don't hide a name.** A listed name still matches across a
non-breaking or double space, a line break between first and last name, a
curly or straight apostrophe (`O’Brien`, `O'Brien`), an invisible soft hyphen
or zero-width space inside a word, and accented letters stored either of the
two ways Unicode allows. The check before saving reads a file the same way,
and also reads web-address encoding (`Rachel%20Kim`). A title or suffix on a
listed person (Dr, Ms, Jr, PhD) is never treated as a name on its own.

**Drag and drop works anywhere on the page**, not only on the upload boxes.
On the Restore tab, a dropped file is the key or the AI's answer; on the
Redact tab, it is the text to redact. A key file dropped anywhere (or chosen
as a file to redact) is loaded as the client key instead of being put in the box, so its originals never sit
in the text you are about to redact. A key never replaces one holding
placeholders you haven't saved yet: save that one first. One file at a time.

**Files it can't read get a way in, not a dead end.** Older Office formats
(`.xls`, `.doc`, `.ppt`, and their Apple and OpenDocument cousins), PDFs while
**Read PDF files** is off, Outlook `.msg` files and images get a note on how
to bring their text across instead: save the file as `.xlsx`, `.docx` or
`.pptx` and open that, tick **Read PDF files**, or copy the text from the app
that opened the file and click **Paste copied text**. If the browser won't
share the clipboard, the box takes the focus and you paste with the keyboard.

Spreadsheet header rows are redacted too, against your list and the patterns:
a pivot export's column names are often the very names you meant to hide.

## What it will not catch

It is a safety net, not a guarantee. Pattern matching misses:

- names nobody listed that "Names that may still be in" didn't point out
  (a name written in lower case, or one that is also an everyday word), and
  nicknames or initials you didn't add as an alias (`Rachel Kim | Rach | RK`);
- a name part that is an everyday word ("Will", "Grant") or two letters
  long ("Li") on its own, unless you add it as an alias;
- anything inside a picture (which is why pictures in Office files become gray
  boxes by default), including a scanned PDF;
- a value a PDF itself broke across two lines, such as an email address in a
  narrow table cell (its name is caught, the rest of the address is not; see
  the PDF section above);
- context that identifies someone without naming them ("the West regional
  buyer who just moved from Seattle");
- phone numbers from outside the US written without their country code, and
  ID numbers other than US Social Security numbers;
- an amount grouped with spaces (`€1 250 000`): only the first group is
  hidden.

**Encoded email files are refused, not guessed at.** Many saved emails
(`.eml`) store their text encoded (base64 or quoted-printable) or carry
attachments. The patterns can't see inside that, but an AI tool decodes it
effortlessly, so the tool stops and asks you to copy the message text from
your mail app and paste it instead.

Read the redacted text before you paste it. When in doubt, leave it out.

## Why you can trust it with real data

- **The page itself makes no network requests.** Its Content Security Policy
  (`default-src 'none'; connect-src 'none'; form-action 'none'`) forbids
  every one: no fetch, no images, no fonts, no form posts. You can prove it:
  turn off Wi-Fi and it works exactly the same.
- **What the page can't control, you can.** Open the downloaded file from
  your own disk, not through a website's preview. Don't translate the page
  (it asks browsers not to offer): translation would send its text, the
  originals included, to a translation service. And a browser extension
  allowed to read local files could read the page, so use a browser profile
  with only extensions you trust.
- **One file, no dependencies.** Everything it does is in
  `redact-restore.html`, readable top to bottom. There is no build step and
  nothing downloaded at runtime.
- **The policy is pinned to the page's own code.** The two `sha256-` hashes
  in the policy match the page's `<style>` and `<script>` exactly, so any
  edit that is not re-pinned makes the page refuse to run rather than run
  loosened.
- **Nothing you open or type is stored.** Closing the tab forgets all of it
  except the files you chose to save. The one thing the page remembers is
  whether you picked the light or dark theme: the word `light` or `dark`,
  kept in this browser under `cortexa-theme`.
- **A hostile file ends quickly.** Every way a file could make the page
  work forever or fill memory has a limit, and the file is refused when it
  hits one: 600 MB unpacked for an Office file and every file inside it
  together, 6 million XML tags in one part, 200 MB unpacked and 20 million
  values and characters for a PDF, 200,000 codes in a font's map. Each limit
  has a test built from the file that used to hang it.
- **It was reviewed, and the review is in the tests.** An independent
  security review in October 2026 found ways a name could slip past, a
  restored value could travel, and a file could hang the page. Each finding
  became a failing test first, then a fix, then was proven by breaking the
  fix on purpose and watching a test catch it.

## For maintainers

```bash
node --test "tools/redact-restore/*.test.mjs"             # runs the page's own script in Node
node tools/redact-restore/update-csp.mjs                   # re-pin the CSP after editing the page
```

The tests run the exact script that ships (extracted from the HTML) and fail
if the CSP hashes drift from the page, if the page gains an external
resource, an inline event handler or a `style=` attribute (which the policy
would silently block), or if any contact detail in the kit's own CRM export
survives redaction. `office.test.mjs` runs the Office support against the
fictional files in `fixtures/` (each written twice: once by Python's Office
libraries, once re-saved by LibreOffice) and fails if any original value
survives in any part of a redacted copy, or if restoring a copy doesn't bring
back the original text. `pdf.test.mjs` runs the PDF reader against PDFs made
by LibreOffice, Chromium, reportlab and by hand, plus a scan, a
password-protected file and the hostile files that used to hang it.
