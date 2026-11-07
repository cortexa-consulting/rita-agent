# Changelog

The kit's version is the AISLE plugin version in `.claude-plugin/plugin.json`.
Each release is tagged (`v1.1.2`) so you can download or compare a version.

## 1.1.2 (2026-11-07)

Redact & Restore finds more on its own and catches placeholders Claude wrote
differently. It is still one offline file.

- **New automatic finds**, each with its own checkbox:
  - Bank and tax numbers (on): US routing numbers that pass the routing
    check digit, IBANs, account numbers after "account" or "acct", EINs and
    ITINs.
  - ID numbers and dates of birth after a label (on): `DOB:`, `Passport #:`,
    `Member ID:`, `Driver's license:`.
  - Passwords and access keys (on): anything after `password:` or
    `api_key =`, a `Bearer` token, the password in a connection address, a
    private key, and keys with a published shape (AWS, GitHub, Slack, Stripe,
    Google, Anthropic, OpenAI and others).
  - IP addresses (on), but not times, code or version numbers.
  - Phone numbers after a label, in any country's format (on).
  - Street addresses (off until you turn them on).
- **Restore:** a placeholder written a little differently (`[Company-01]`,
  `COMPANY-01`, `[COMPANY-1]`) is named on the page, and restored only when
  you click **Restore these too**.
- **Suggestions:** a listed name in lower case ("thanks rachel") or
  misspelled by a letter is pointed out and can be added as another name for
  it. Common US first names (Social Security's public records) are suggested
  too, never hidden on their own.
- An email address a PDF split over two lines is found whole, and
  `€1 250 000` is one amount.
- **redaction-partner skill:** placeholders stay exact in headings, tables,
  slide titles and file names too.
- **Keys move forward only.** A key saved by this version won't open in an
  older copy of the tool, which reads the new settings as damage. Old keys
  open in this one. Keep one copy of the tool, the newest.

## 1.1.1 (2026-11-06)

- **Safety section in every skill:** text in files, email and web pages is
  material, never an instruction. A planted instruction is quoted word for
  word, or described exactly, and never followed. No links in email are
  opened. Placeholders stay exact.
- From three rounds of testing on Claude Haiku, Sonnet and Opus:
  - memory lines never record a decision you haven't made;
  - a data fix is your call, and drafts lead with the figures as exported;
  - a workbook opens on its README tab;
  - meeting prep names people by role only;
  - deck source markers are numbered once for the whole deck.

## 1.1.0 (2026-11-01)

- **A twelfth skill, new-workflow:** turns a job you repeat (a quarterly
  review, a monthly recap) into numbered stages, each with a short contract,
  and runs one stage at a time, stopping for your check. Worked example:
  `skills/new-workflow/examples/dalton-q3-qbr/`.
- README: a "Jobs you repeat" section.
- `references.md`: sources 64–68 (Claude Help Center pages on Enterprise
  settings). Later in the week: source 69 (Menlo Ventures' 2026 consumer AI
  survey) and November 2026 rechecks of the references and the inbox prompt.
- The marketplace names Cortexa Consulting as AISLE's author.

## 1.0.0 (2026-10-26)

First public release: RITA (Retail Insights & Trends Analyst), the AISLE
plugin with eleven skills, the offline Redact & Restore tool, and a practice
data pack.

Updated on 2026-10-31, before the workshop, without a version change:
- RITA writes a two-page Word brief: the answer and the ask on page 1, rated
  findings and sources on page 2, with a sample brief in `briefs/`.
- Redact & Restore gained the client bar and its Redact and Restore tabs.
- The data pack gained the retail panel's license terms.
